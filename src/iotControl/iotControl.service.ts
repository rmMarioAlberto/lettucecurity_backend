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

    // 1. Validar parcela y obtener parámetros del cultivo
    const { parcela, paramsMap } =
      await this.validateAndGetCultivoParams(idParcela);

    // 2. Procesar todas las lecturas IoT
    const iotReadingsToAdd = await this.processIotReadings(
      data,
      idParcela,
      paramsMap,
    );

    // 3. Obtener ciclo activo (debe existir previamente)
    const activeCycle = await this.getActiveCycle(idParcela);

    // 4. Insertar lecturas en la etapa activa
    await this.addReadingsToActiveStage(activeCycle, iotReadingsToAdd);

    return {
      message:
        'Datos enviados exitosamente con clasificación de imagen y sensores',
    };
  }

  // ============================================================
  // MÉTODOS PRIVADOS
  // ============================================================

  private async validateAndGetCultivoParams(idParcela: number) {
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

    return { parcela, paramsMap };
  }

  private async processIotReadings(
    data: SubmitIotDataDto[],
    idParcela: number,
    paramsMap: Map<number, any>,
  ) {
    return Promise.all(
      data.map(async (iotData) => {
        const { idIot, hora, image, dataSensores } = iotData;

        // Validar IoT
        await this.validateIot(idIot);

        if (!image) {
          throw new BadRequestException('Imagen requerida para la lectura IoT');
        }

        // Subir imagen y clasificarla
        const { imageUrl, imageResult } = await this.processImage(
          image,
          idParcela,
          idIot,
        );

        // Evaluar sensores
        const sensorReadingsWithStatus = await this.evaluateSensors(
          dataSensores,
          paramsMap,
        );

        // Calcular estado general
        const overallStatus = this.calculateOverallStatus(
          sensorReadingsWithStatus,
        );

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
  }

  private async validateIot(idIot: number) {
    const checkIot = await this.prismaPostgres.iot.findUnique({
      where: { id_iot: idIot },
    });

    if (!checkIot) {
      throw new BadRequestException(`El IoT con id ${idIot} no existe`);
    }
  }

  private async processImage(image: string, parcelaId: number, idIot: number) {
    // Subir imagen a Cloudinary
    const uploadResult = await this.cloudinary.uploadBase64(image, {
      parcelaId,
      public_id: `iot_${idIot}_${Date.now()}`,
    });
    const imageUrl = uploadResult.secure_url;

    // Clasificar imagen con IA
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

    return { imageUrl, imageResult };
  }

  private async evaluateSensors(
    dataSensores: Array<{ idSensor: number; lectura: number }>,
    paramsMap: Map<number, any>,
  ) {
    return Promise.all(
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

        return this.evaluateSensorReading(lectura, param, idSensor);
      }),
    );
  }

  private evaluateSensorReading(lectura: number, param: any, idSensor: number) {
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
  }

  private calculateOverallStatus(sensorReadings: any[]) {
    if (
      sensorReadings.some((sr) =>
        ['alto', 'bajo', 'preocupante_alto', 'preocupante_bajo'].includes(
          sr.status,
        ),
      )
    ) {
      return 'preocupante';
    } else if (
      sensorReadings.some((sr) => ['error', 'desconocido'].includes(sr.status))
    ) {
      return 'desconocido';
    }
    return 'bueno';
  }

  private async getActiveCycle(idParcela: number) {
    const activeCycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: {
        id_parcela: idParcela,
        endDate: null,
      },
      select: { id_cycle: true, stages: true, current_stage_index: true },
    });

    if (!activeCycle) {
      throw new BadRequestException(
        `No existe un ciclo activo para la parcela ${idParcela}. Debe crear un ciclo antes de enviar datos.`,
      );
    }

    return activeCycle;
  }

  private async addReadingsToActiveStage(
    activeCycle: any,
    iotReadingsToAdd: any[],
  ) {
    const activeStageIndex = activeCycle.current_stage_index;

    if (activeStageIndex === -1) {
      throw new BadRequestException(
        'El ciclo no tiene una etapa activa configurada',
      );
    }

    // Obtener el ciclo completo
    const cycle = await this.prismaMongo.parcela_cycles.findUnique({
      where: { id_cycle: activeCycle.id_cycle },
    });

    if (!cycle) {
      throw new BadRequestException(
        `No se encontró el ciclo activo con id ${activeCycle.id_cycle}`,
      );
    }

    // Copia profunda de las etapas
    const updatedStages = JSON.parse(JSON.stringify(cycle.stages));

    // Insertar lecturas en la etapa activa
    updatedStages[activeStageIndex].readings.push(...iotReadingsToAdd);

    // Guardar cambios
    await this.prismaMongo.parcela_cycles.update({
      where: { id_cycle: activeCycle.id_cycle },
      data: {
        stages: updatedStages,
      },
    });
  }
}
