import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import {
  CreateCycleDto,
  CreateParcelaDto,
  EndCycleDto,
  GetDataParcela,
  GetIotsParcelaDto,
  GetStageParcela,
  UpdateCurrentStageDto,
} from './dto/parcela.dto';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';
import { AuthUtilsService } from '../utils/getUser.service';

@Injectable()
export class ParcelaService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
    private authUtils: AuthUtilsService,
  ) {}

  async getParcelasAll() {
    const parcelas = await this.prismaPostgres.parcela.findMany();

    return parcelas;
  }

  async getParcelasUser(accessToken: string) {
    const userId = this.authUtils.getUserIdFromToken(accessToken);
    const parcelas = await this.prismaPostgres.parcela.findMany({
      where: { id_usuario: userId },
    });

    return parcelas;
  }

  async createParcela(createParcelaDto: CreateParcelaDto) {
    const {
      id_usuario,
      idCultivo,
      nombre,
      descripcion,
      largo,
      ancho,
      latitud,
      longitud,
    } = createParcelaDto;

    const parcela = await this.prismaPostgres.parcela.create({
      data: {
        id_usuario,
        id_cultivo: idCultivo,
        nombre,
        descripcion,
        largo,
        ancho,
        latitud,
        longitud,
      },
    });

    return parcela;
  }

  async getDataParcela(dto: GetDataParcela) {
    const { idParcela, idIots, fechaInicio, fechaFin } = dto;

    // Validar fechas si se proporcionan
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (fechaInicio && fechaFin) {
      startDate = new Date(fechaInicio);
      endDate = new Date(fechaFin);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new BadRequestException('Formato de fecha inválido');
      }

      if (startDate > endDate) {
        throw new BadRequestException(
          'La fecha de inicio debe ser anterior a la fecha de fin',
        );
      }
    } else if (fechaInicio || fechaFin) {
      throw new BadRequestException(
        'Debe proporcionar ambas fechas (fechaInicio y fechaFin) o ninguna',
      );
    }

    // Validar IoTs si se proporcionan
    if (idIots && idIots.length > 0) {
      const validIots = await this.prismaPostgres.iot.findMany({
        where: {
          id_parcela: idParcela,
          id_iot: { in: idIots },
        },
      });

      if (validIots.length !== idIots.length) {
        const foundIds = validIots.map((iot) => iot.id_iot);
        const notFoundIds = idIots.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `IoTs no encontrados en la parcela: ${notFoundIds.join(', ')}`,
        );
      }
    }

    const cycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: { id_parcela: idParcela },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      throw new NotFoundException(
        `No se encontró información de ciclos para la parcela ${idParcela}`,
      );
    }

    // Obtener todos los IDs de sensores únicos de todas las lecturas
    const allReadings = cycle.stages.flatMap((stage) => stage.readings);
    const sensorIds = allReadings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.id_sensor),
    );
    const uniqueSensorIds = [...new Set(sensorIds)].map((n) => Number(n));

    // Obtener información de IoTs y sensores desde PostgreSQL
    const iots = await this.prismaPostgres.iot.findMany({
      where: { id_parcela: idParcela },
    });

    const sensors =
      uniqueSensorIds.length > 0
        ? await this.prismaPostgres.sensor.findMany({
            where: { id_sensor: { in: uniqueSensorIds } },
            select: {
              id_sensor: true,
              nombre: true,
              unidad_medicion: true,
              modelo: true,
            },
          })
        : [];

    const sensorMap = new Map(sensors.map((s) => [s.id_sensor, s]));

    // Mapear las etapas con sus lecturas enriquecidas y filtradas
    const stages = cycle.stages.map((stage) => ({
      stage_index: stage.stage_index,
      stage_name: stage.stage_name,
      startDate: stage.startDate,
      endDate: stage.endDate,
      readings: stage.readings
        .filter((iotReading) => {
          // Filtrar por IoTs si se especificaron
          if (idIots && idIots.length > 0) {
            if (!idIots.includes(iotReading.id_iot)) {
              return false;
            }
          }

          // Filtrar por fechas si se especificaron
          if (startDate && endDate) {
            const readingDate = new Date(iotReading.hora);
            if (readingDate < startDate || readingDate > endDate) {
              return false;
            }
          }

          return true;
        })
        .map((iotReading) => {
          const iotInfo = iots.find((i) => i.id_iot === iotReading.id_iot);

          return {
            id_iot: iotReading.id_iot,
            descripcion: iotInfo?.descripcion,
            coordenada_x: iotInfo?.coordenada_x,
            coordenada_y: iotInfo?.coordenada_y,
            hora: iotReading.hora,
            imagen: iotReading.image_url,
            image_result: iotReading.image_result,
            overall_status: iotReading.overall_status,
            sensores: iotReading.sensorReadings.map((sr) => {
              const sensor = sensorMap.get(sr.id_sensor);
              return {
                id_sensor: sr.id_sensor,
                lectura: sr.lectura,
                status: sr.status,
                deviation: sr.deviation,
                message: sr.message,
                nombre: sensor?.nombre,
                unidad_medicion: sensor?.unidad_medicion,
                modelo: sensor?.modelo,
              };
            }),
          };
        }),
    }));

    const response: any = {
      id_parcela: idParcela,
      id_cycle: cycle.id_cycle,
      ciclo_num: cycle.ciclo_num,
      cultivo_id: cycle.cultivo_id,
      cultivo_name: cycle.cultivo_name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      current_stage_index: cycle.current_stage_index,
      stages,
    };

    // Agregar información de filtros aplicados
    if (idIots && idIots.length > 0) {
      response.filtros_aplicados = {
        ...response.filtros_aplicados,
        iots: idIots,
      };
    }

    if (fechaInicio && fechaFin) {
      response.filtros_aplicados = {
        ...response.filtros_aplicados,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      };
    }

    return response;
  }

  async getIotsParcela(dto: GetIotsParcelaDto) {
    const iots = await this.prismaPostgres.iot.findMany({
      where: { id_parcela: dto.idParcela, status: 1 },
      include: {
        sensor_iot: {
          include: {
            sensor: true,
          },
        },
      },
    });
    return iots;
  }

  async getStagePacela(dto: GetStageParcela) {
    const cycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: { id_parcela: dto.idParcela },
    });

    if (!cycle) {
      return null;
    }

    // Mapear las etapas sin las lecturas
    const stagesWithoutReadings = cycle.stages.map((stage) => ({
      stage_index: stage.stage_index,
      stage_name: stage.stage_name,
      startDate: stage.startDate,
      endDate: stage.endDate,
    }));

    return {
      id_cycle: cycle.id_cycle,
      id_parcela: cycle.id_parcela,
      ciclo_num: cycle.ciclo_num,
      cultivo_id: cycle.cultivo_id,
      cultivo_name: cycle.cultivo_name,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      current_stage_index: cycle.current_stage_index,
      stages: stagesWithoutReadings,
    };
  }

  async updateCurrentStage(dto: UpdateCurrentStageDto) {
    const cycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: { id_parcela: dto.idParcela },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      throw new NotFoundException(
        `No se encontró un ciclo para la parcela ${dto.idParcela}`,
      );
    }

    // Validar que el stageIndex exista en el ciclo
    if (dto.stageIndex < 0 || dto.stageIndex >= cycle.stages.length) {
      throw new BadRequestException(
        `El índice de etapa ${dto.stageIndex} no es válido. El ciclo tiene ${cycle.stages.length} etapas (índices 0-${cycle.stages.length - 1})`,
      );
    }

    // Actualizar la fecha de inicio de la nueva etapa si aún no tiene
    const updatedStages = JSON.parse(JSON.stringify(cycle.stages));
    if (!updatedStages[dto.stageIndex].startDate) {
      updatedStages[dto.stageIndex].startDate = new Date();
    }

    // Cerrar la etapa anterior si existe
    if (
      cycle.current_stage_index >= 0 &&
      cycle.current_stage_index < updatedStages.length
    ) {
      if (!updatedStages[cycle.current_stage_index].endDate) {
        updatedStages[cycle.current_stage_index].endDate = new Date();
      }
    }

    const updated = await this.prismaMongo.parcela_cycles.update({
      where: { id_cycle: cycle.id_cycle },
      data: {
        current_stage_index: dto.stageIndex,
        stages: updatedStages,
      },
    });

    return updated;
  }

  async createCycle(dto: CreateCycleDto) {
    const { idParcela } = dto;

    // Verificar si ya existe un ciclo activo (endDate es null)
    const activeCycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: {
        id_parcela: idParcela,
        endDate: null,
      },
    });

    if (activeCycle) {
      throw new BadRequestException(
        `Ya existe un ciclo activo para la parcela ${idParcela}. Debe finalizar el ciclo actual antes de crear uno nuevo.`,
      );
    }

    // Obtener información de la parcela desde PostgreSQL
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      include: { cultivo: true },
    });

    if (!parcela) {
      throw new NotFoundException(
        `No se encontró la parcela con ID ${idParcela}`,
      );
    }

    const idCultivo = parcela.id_cultivo;
    if (!idCultivo) {
      throw new BadRequestException('La parcela no tiene un cultivo asignado');
    }

    // Obtener las etapas de crecimiento del cultivo
    const growthStages = await this.prismaMongo.growth_stages.findFirst({
      where: { cultivo_id: idCultivo },
    });

    if (!growthStages) {
      throw new NotFoundException(
        `No hay etapas de crecimiento definidas para el cultivo ${idCultivo}`,
      );
    }

    // Contar ciclos anteriores para determinar el número de ciclo
    const previousCycles = await this.prismaMongo.parcela_cycles.count({
      where: { id_parcela: idParcela },
    });

    // Mapear las etapas iniciales
    const mappedStages = growthStages.stages.map((s, index) => ({
      stage_index: s.stage_index,
      stage_name: s.stage_name,
      startDate: index === 0 ? new Date() : null,
      endDate: null,
      readings: [],
    }));

    // Crear el nuevo ciclo
    const newCycle = await this.prismaMongo.parcela_cycles.create({
      data: {
        id_parcela: idParcela,
        ciclo_num: previousCycles + 1,
        cultivo_id: idCultivo,
        cultivo_name: parcela.cultivo?.nombre ?? 'Desconocido',
        startDate: new Date(),
        endDate: null,
        current_stage_index: 0,
        stages: mappedStages,
      },
    });

    return newCycle;
  }

  async endCycle(dto: EndCycleDto) {
    const { idParcela } = dto;

    // Buscar el ciclo activo (endDate es null)
    const activeCycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: {
        id_parcela: idParcela,
        endDate: null,
      },
    });

    if (!activeCycle) {
      throw new NotFoundException(
        `No existe un ciclo activo para la parcela ${idParcela}`,
      );
    }

    // Copia profunda de las etapas para cerrar la etapa activa
    const updatedStages = JSON.parse(JSON.stringify(activeCycle.stages));

    // Cerrar la etapa activa si existe
    if (
      activeCycle.current_stage_index >= 0 &&
      activeCycle.current_stage_index < updatedStages.length
    ) {
      if (!updatedStages[activeCycle.current_stage_index].endDate) {
        updatedStages[activeCycle.current_stage_index].endDate = new Date();
      }
    }

    // Actualizar el ciclo con la fecha de finalización
    const closedCycle = await this.prismaMongo.parcela_cycles.update({
      where: { id_cycle: activeCycle.id_cycle },
      data: {
        endDate: new Date(),
        stages: updatedStages,
      },
    });

    return {
      message: `Ciclo ${closedCycle.ciclo_num} finalizado exitosamente`,
      cycle: closedCycle,
    };
  }
}
