import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';

@Injectable()
export class ChatbotQueryService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
  ) {}

  /////////////////////////////////////////////////////////////////
  // Helper principal:
  // Obtiene TODAS las lecturas IoT de una parcela, de todos sus
  // ciclos y todas sus etapas.
  /////////////////////////////////////////////////////////////////
  private async getAllReadingsForParcela(idParcela: number) {
    const cycles = await this.prismaMongo.parcela_cycles.findMany({
      where: { id_parcela: idParcela },
      select: { stages: true },
    });

    if (!cycles.length) return [];

    return cycles.flatMap((cycle) =>
      cycle.stages.flatMap((stage) => stage.readings),
    );
  }

  /////////////////////////////////////////////////////////////////
  // 1. Información básica de parcela
  /////////////////////////////////////////////////////////////////
  async getBasicParcelaInfo(idParcela: number) {
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      select: {
        nombre: true,
        descripcion: true,
        largo: true,
        ancho: true,
        latitud: true,
        longitud: true,
        status: true,
      },
    });

    if (!parcela)
      throw new NotFoundException(`Parcela ${idParcela} no encontrada`);

    return parcela;
  }

  /////////////////////////////////////////////////////////////////
  // 2. Información del cultivo
  /////////////////////////////////////////////////////////////////
  async getCultivoInfo(idParcela: number) {
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      select: { id_cultivo: true },
    });

    if (!parcela || !parcela.id_cultivo) return null;

    return this.prismaPostgres.cultivo.findUnique({
      where: { id_cultivo: parcela.id_cultivo },
      select: { nombre: true, tipo: true, status: true },
    });
  }

  /////////////////////////////////////////////////////////////////
  // 3. Parámetros óptimos del cultivo (de Mongo)
  /////////////////////////////////////////////////////////////////
  async getCultivoParams(idParcela: number) {
    const parcela = await this.prismaPostgres.parcela.findUnique({
      where: { id_parcela: idParcela },
      select: { id_cultivo: true },
    });

    if (!parcela || !parcela.id_cultivo) return null;

    return this.prismaMongo.cultivo_params.findUnique({
      where: { id: parcela.id_cultivo },
      select: { params: true },
    });
  }

  /////////////////////////////////////////////////////////////////
  // 4. IoTs de la parcela
  /////////////////////////////////////////////////////////////////
  async getIotsForParcela(idParcela: number) {
    return this.prismaPostgres.iot.findMany({
      where: { id_parcela: idParcela },
      select: {
        id_iot: true,
        descripcion: true,
        token: true,
        status: true,
        ultima_conexion: true,
      },
    });
  }

  /////////////////////////////////////////////////////////////////
  // 5. Lecturas recientes (últimas N)
  /////////////////////////////////////////////////////////////////
  async getRecentReadings(idParcela: number, limit: number = 5) {
    const readings = await this.getAllReadingsForParcela(idParcela);
    return readings.slice(-limit);
  }

  /////////////////////////////////////////////////////////////////
  // 6. Lecturas por IoT
  /////////////////////////////////////////////////////////////////
  async getReadingsByIot(idParcela: number, idIot: number) {
    const readings = await this.getAllReadingsForParcela(idParcela);
    return readings.filter((r) => r.id_iot === idIot);
  }

  /////////////////////////////////////////////////////////////////
  // 7. Resumen de status (bueno, alto, crítico…)
  /////////////////////////////////////////////////////////////////
  async getStatusSummary(idParcela: number, limit: number = 10) {
    const readings = await this.getRecentReadings(idParcela, limit);

    const statuses = readings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.status),
    );

    return statuses.reduce((acc: Record<string, number>, status) => {
      if (!status) return acc;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  /////////////////////////////////////////////////////////////////
  // 8. Lecturas por sensor
  /////////////////////////////////////////////////////////////////
  async getReadingsBySensor(idParcela: number, idSensor: number) {
    const readings = await this.getAllReadingsForParcela(idParcela);

    return readings.flatMap((r) =>
      r.sensorReadings.filter((sr) => sr.id_sensor === idSensor),
    );
  }

  /////////////////////////////////////////////////////////////////
  // 9. Promedio de lecturas por sensor
  /////////////////////////////////////////////////////////////////
  async getAverageReadingsBySensor(
    idParcela: number,
    idSensor: number,
    limit: number = 10,
  ) {
    const readings = await this.getReadingsBySensor(idParcela, idSensor);
    const recent = readings.slice(-limit);

    const sum = recent.reduce((acc, r) => acc + r.lectura, 0);

    return {
      average: recent.length ? sum / recent.length : null,
      count: recent.length,
    };
  }

  /////////////////////////////////////////////////////////////////
  // 10. Sensores asociados a la parcela
  /////////////////////////////////////////////////////////////////
  async getSensorsForParcela(idParcela: number) {
    const iots = await this.prismaPostgres.iot.findMany({
      where: { id_parcela: idParcela },
      select: { id_iot: true },
    });

    const iotIds = iots.map((i) => i.id_iot);

    return this.prismaPostgres.sensor_iot.findMany({
      where: { id_iot: { in: iotIds } },
      include: {
        sensor: {
          select: {
            id_sensor: true,
            nombre: true,
            unidad_medicion: true,
            modelo: true,
          },
        },
      },
    });
  }

  /////////////////////////////////////////////////////////////////
  // 11. Categorías de sensores
  /////////////////////////////////////////////////////////////////
  async getSensorCategoriesForParcela(idParcela: number) {
    const sensors = await this.getSensorsForParcela(idParcela);
    const sensorIds = sensors.map((s) => s.sensor.id_sensor);

    return this.prismaPostgres.sensor.findMany({
      where: { id_sensor: { in: sensorIds } },
    });
  }

  /////////////////////////////////////////////////////////////////
  // 12. Últimas imágenes
  /////////////////////////////////////////////////////////////////
  async getRecentImages(idParcela: number, limit: number = 5) {
    const readings = await this.getAllReadingsForParcela(idParcela);

    return readings.slice(-limit).map((r) => ({
      image_url: r.image_url,
      image_result: r.image_result,
    }));
  }

  /////////////////////////////////////////////////////////////////
  // 13. Análisis de deviation por sensor
  /////////////////////////////////////////////////////////////////
  async getDeviationAnalysis(
    idParcela: number,
    idSensor: number,
    limit: number = 10,
  ) {
    const readings = await this.getReadingsBySensor(idParcela, idSensor);

    const recent = readings.slice(-limit).filter((r) => r.deviation != null);

    const sum = recent.reduce((acc, r) => acc + (r.deviation ?? 0), 0);

    return {
      averageDeviation: recent.length ? sum / recent.length : null,
      count: recent.length,
    };
  }

  /////////////////////////////////////////////////////////////////
  // 14. Conteo global de statuses
  /////////////////////////////////////////////////////////////////
  async getGlobalStatusCount(idParcela: number) {
    const readings = await this.getAllReadingsForParcela(idParcela);

    const statuses = readings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.status),
    );

    return statuses.reduce((acc: Record<string, number>, status) => {
      if (!status) return acc;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  /////////////////////////////////////////////////////////////////
  // 15. Lecturas filtradas por status
  /////////////////////////////////////////////////////////////////
  async getReadingsByStatus(idParcela: number, targetStatus: string) {
    const readings = await this.getAllReadingsForParcela(idParcela);

    return readings.flatMap((r) =>
      r.sensorReadings.filter((sr) => sr.status === targetStatus),
    );
  }
}
