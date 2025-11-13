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

    const checkParcel = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
    });

    if (!checkParcel) {
      throw new BadRequestException('La parcela no existe en el sistema');
    }

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

        await Promise.all(
          dataSensores.map(async (sensor) => {
            const checkSensor = await this.prismaPostgres.sensor.findUnique({
              where: { id_sensor: sensor.idSensor },
            });
            if (!checkSensor) {
              throw new BadRequestException(
                `El sensor con id ${sensor.idSensor} no existe`,
              );
            }
          }),
        );

        return {
          id_iot: idIot,
          hora: new Date(hora),
          image_url: imageUrl,
          image_result: imageResult,
          sensorReadings: dataSensores.map((sensor) => ({
            id_sensor: sensor.idSensor,
            lectura: sensor.lectura,
          })),
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
      message: 'Datos enviados exitosamente con clasificación de imagen',
    };
  }
}
