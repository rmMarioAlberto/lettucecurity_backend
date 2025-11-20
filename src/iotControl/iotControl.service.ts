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

    // 1. Validar que la parcela exista
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      include: { cultivo: true },
    });

    if (!parcela) {
      throw new BadRequestException('La parcela no existe en el sistema');
    }

    const idCultivo = parcela.id_cultivo;
    if (idCultivo === null || idCultivo === undefined) {
      throw new BadRequestException('La parcela no tiene un cultivo asignado');
    }

    // 2. Obtener parámetros del cultivo desde Mongo
    const cultivoParams = await this.prismaMongo.cultivo_params.findUnique({
      where: { id: idCultivo },
    });

    if (!cultivoParams) {
      throw new BadRequestException(
        `No se encontraron parámetros para el cultivo con ID ${idCultivo}`,
      );
    }

    const paramsMap = new Map(
      cultivoParams.params.map((p) => [p.category_id, p]),
    );

    // ============================================================
    // 3. PROCESAR TODAS LAS LECTURAS IOT
    // ============================================================
    const iotReadingsToAdd = await Promise.all(
      data.map(async (iotData: SubmitIotDataDto) => {
        const { idIot, hora, image, dataSensores } = iotData;

        // 3.1 Validar IoT
        const checkIot = await this.prismaPostgres.iot.findUnique({
          where: { id_iot: idIot },
        });

        if (!checkIot) {
          throw new BadRequestException(`El IoT con id ${idIot} no existe`);
        }

        if (!image)
          throw new BadRequestException('Imagen requerida para la lectura IoT');

        // 3.2 Subir imagen
        const uploadResult = await this.cloudinary.uploadBase64(image, {
          parcelaId: idParcela,
          public_id: `iot_${idIot}_${Date.now()}`,
        });
        const imageUrl = uploadResult.secure_url;

        let imageResult = 'Desconocido';
        try {
          const response = await axios.post(
            'https://web-production-02772.up.railway.app/predict',
            { image },
          );

          imageResult =
            response.data.result || JSON.stringify(response.data.prediction);
        } catch (error) {
          console.error('Error al clasificar la imagen:', error.message);
        }

        // 3.4 Evaluar sensores
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
                message:
                  'No se encontraron parámetros para esta categoría en el cultivo',
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

            const deviation =
              param.optimal !== undefined ? lectura - param.optimal : null;

            let status = 'bueno';
            let message = 'Lectura dentro del rango óptimo';

            if (lectura < param.min) {
              status = 'bajo';
              message =
                deviation !== null
                  ? `Lectura ${Math.abs(deviation).toFixed(2)} por debajo del óptimo`
                  : 'Lectura por debajo del óptimo';
            } else if (lectura > param.max) {
              status = 'alto';
              message =
                deviation !== null
                  ? `Lectura ${deviation.toFixed(2)} por encima del óptimo`
                  : 'Lectura por encima del óptimo';
            } else if (
              param.warning_threshold !== undefined &&
              deviation !== null &&
              Math.abs(deviation) > param.warning_threshold
            ) {
              status = deviation > 0 ? 'preocupante_alto' : 'preocupante_bajo';
              message = `Lectura cerca del límite: ${deviation.toFixed(2)} del óptimo`;
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
        if (
          sensorReadingsWithStatus.some((sr) =>
            ['alto', 'bajo', 'preocupante_alto', 'preocupante_bajo'].includes(
              sr.status,
            ),
          )
        ) {
          overallStatus = 'preocupante';
        } else if (
          sensorReadingsWithStatus.some((sr) =>
            ['error', 'desconocido'].includes(sr.status),
          )
        ) {
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

    // ============================================================
    // 4. INSERTAR EN EL NUEVO MODELO: parcela_cycles → stages → readings
    // ============================================================

    // 4.1 Buscar ciclo activo
    let activeCycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: {
        id_parcela: idParcela,
        endDate: null,
      },
      select: { id_cycle: true, stages: true, current_stage_index : true },
    });

    // SI NO EXISTE CICLO → CREAR UNO
    if (!activeCycle) {
      // TRAER ETAPAS BASE DEL CULTIVO
      const growthStages = await this.prismaMongo.growth_stages.findFirst({
        where: { cultivo_id: idCultivo },
      });

      if (!growthStages) {
        throw new BadRequestException(
          `No hay etapas definidas para el cultivo ${idCultivo}`,
        );
      }

      // MAPEAR ETAPAS INICIALES
      const mappedStages = growthStages.stages.map((s) => ({
        stage_index: s.stage_index,
        stage_name: s.stage_name,
        startDate: new Date(), // LAS ETAPAS EMPIEZAN AHORA
        endDate: null,
        readings: [],
      }));

      // CREAR EL CICLO REAL
      activeCycle = await this.prismaMongo.parcela_cycles.create({
        data: {
          id_parcela: idParcela,
          ciclo_num: 1,
          cultivo_id: idCultivo,
          cultivo_name: parcela.cultivo?.nombre ?? 'Desconocido',
          startDate: new Date(),
          endDate: null,
          current_stage_index: 1,
          stages: mappedStages,
        },
        select: { id_cycle: true, stages: true, current_stage_index : true },
      });
    }

    // 4.2 Buscar etapa activa
    let activeStageIndex = activeCycle.current_stage_index;

    if (activeStageIndex === -1) {
      const newStage = {
        stage_index: 1,
        stage_name: 'Etapa automática',
        startDate: new Date(),
        endDate: null,
        readings: [],
      };

      await this.prismaMongo.parcela_cycles.update({
        where: { id_cycle: activeCycle.id_cycle },
        data: {
          stages: {
            push: newStage,
          },
        },
      });

      activeStageIndex = 0;
      activeCycle.stages.push(newStage);
    }

    // 4.3 Insertar lecturas

    const cycle = await this.prismaMongo.parcela_cycles.findUnique({
      where: { id_cycle: activeCycle.id_cycle },
    });

    // Si cycle fuera null (no debería pasar), lanzar error seguro
    if (!cycle) {
      throw new BadRequestException(
        `No se encontró el ciclo activo con id ${activeCycle.id_cycle}`,
      );
    }

    // Copia profunda
    const updatedStages = JSON.parse(JSON.stringify(cycle.stages));

    // Insertar lecturas
    updatedStages[activeStageIndex].readings.push(...iotReadingsToAdd);

    // Guardar de vuelta
    await this.prismaMongo.parcela_cycles.update({
      where: { id_cycle: activeCycle.id_cycle },
      data: {
        stages: updatedStages,
      },
    });

    return {
      message:
        'Datos enviados exitosamente con clasificación de imagen y sensores',
    };
  }
}
