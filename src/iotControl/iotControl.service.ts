import { BadRequestException, Injectable } from '@nestjs/common';
import { SubmitDataDto, SubmitIotDataDto } from './dto/iotControl.dto';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import axios from 'axios';

@Injectable()
export class IotControlService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async submitData(dto: SubmitDataDto) {
    const { idParcela, data } = dto;

    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
    });

    if (!parcela) {
      throw new BadRequestException('La parcela no existe en el sistema');
    }

    const idCultivo = parcela.id_cultivo;
    if (!idCultivo) {
      throw new BadRequestException('La parcela no tiene un cultivo asignado');
    }

    // Cargar parámetros óptimos del cultivo desde MongoDB
    const cultivoParams = await this.prismaMongo.cultivo_params.findUnique({
      where: { id: idCultivo },
    });

    if (!cultivoParams) {
      throw new BadRequestException(`No se encontraron parámetros para el cultivo con ID ${idCultivo}`);
    }

    const paramsMap = new Map(cultivoParams.params.map(p => [p.category_id, p]));

    const iotReadingsToAdd = await Promise.all(
      data.map(async (iotData: SubmitIotDataDto) => {
        const { idIot, hora, image, dataSensores } = iotData;

        const checkIot = await this.prismaPostgres.iot.findUnique({
          where: { id_iot: idIot },
        });

        if (!checkIot) {
          throw new BadRequestException(`El IoT con id ${idIot} no existe`);
        }

        if (!image)
          throw new BadRequestException('Imagen requerida para la lectura IoT');

        const uploadResult = await this.cloudinary.uploadBase64(image, {
          parcelaId: idParcela,
          public_id: `iot_${idIot}_${Date.now()}`,
        });
        const imageUrl = uploadResult.secure_url;

        let imageResult = 'Desconocido';
        try {
          const response = await axios.post('http://127.0.0.1:8000/predict', {
            image_url: imageUrl,
          });
          console.log(response);

          imageResult =
            response.data.result || JSON.stringify(response.data.prediction);
        } catch (error) {
          console.error('Error al clasificar la imagen:', error.message);
        }

        const sensorReadingsWithStatus = await Promise.all(
          dataSensores.map(async (sensor) => {
            const { idSensor, lectura } = sensor;

            const checkSensor = await this.prismaPostgres.sensor.findUnique({
              where: { id_sensor: idSensor },
            });
            if (!checkSensor) {
              throw new BadRequestException(
                `El sensor con id ${idSensor} no existe`,
              );
            }

            const idCategory = checkSensor.id_category;
            if (!idCategory) {
              return {
                id_sensor: idSensor,
                lectura,
                status: 'desconocido',
                deviation: null,
                message: 'No se encontró categoría para este sensor',
              };
            }

            const param = paramsMap.get(idCategory);
            if (!param) {
              return {
                id_sensor: idSensor,
                lectura,
                status: 'desconocido',
                deviation: null,
                message: 'No se encontraron parámetros para esta categoría en el cultivo',
              };
            }

            if (checkSensor.unidad_medicion !== param.unidad_medicion) {
              return {
                id_sensor: idSensor,
                lectura,
                status: 'error',
                deviation: null,
                message: 'Unidad de medición no coincide con la categoría',
              };
            }

            const deviation = param.optimal !== undefined ? lectura - param.optimal : null;

            let status = 'bueno';
            let message = 'Lectura dentro del rango óptimo';

            if (param.min !== undefined && lectura < param.min) {
              status = 'bajo';
              message = deviation !== null
                ? `Lectura ${Math.abs(deviation).toFixed(2)} por debajo del óptimo`
                : 'Lectura por debajo del óptimo';
            } else if (param.max !== undefined && lectura > param.max) {
              status = 'alto';
              message = deviation !== null
                ? `Lectura ${deviation.toFixed(2)} por encima del óptimo`
                : 'Lectura por encima del óptimo';
            } else if (param.warning_threshold !== undefined && deviation !== null) {
              if (Math.abs(deviation) > param.warning_threshold) {
                status = deviation > 0 ? 'preocupante_alto' : 'preocupante_bajo';
                message = `Lectura cerca del límite: ${deviation.toFixed(2)} del óptimo`;
              }
            }

            return {
              id_sensor: idSensor,
              lectura,
              status,
              deviation,
              message,
            };
          }),
        );

        let overallStatus = 'bueno';
        if (sensorReadingsWithStatus.some(sr => sr.status.includes('preocupante') || sr.status === 'alto' || sr.status === 'bajo')) {
          overallStatus = 'preocupante';
        } else if (sensorReadingsWithStatus.some(sr => sr.status === 'error' || sr.status === 'desconocido')) {
          overallStatus = 'desconocido';
        }

        return {
          id_iot: idIot,
          hora: new Date(hora),
          image_url: imageUrl,
          image_result: imageResult,
          sensorReadings: sensorReadingsWithStatus,
          overall_status: overallStatus,
        };
      }),
    );

    await this.prismaMongo.parcela_data.upsert({
      where: { id_parcela: idParcela },
      update: {
        iotReadings: {
          push: JSON.parse(JSON.stringify(iotReadingsToAdd)),
        },
      },
      create: {
        id_parcela: idParcela,
        iotReadings: JSON.parse(JSON.stringify(iotReadingsToAdd)),
      },
    });

    return {
      message: 'Datos enviados exitosamente con clasificación de imagen y sensores',
    };
  }
}