import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { PrismaServiceMongo } from '../prisma/prismaMongo.service';

@Injectable()
export class ChatbotQueryService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
  ) {}

  /**
   * Consulta 1: Obtener información básica de la parcela (nombre, descripción, dimensiones, ubicación, status).
   * Optimizada: Solo campos esenciales, sin relaciones innecesarias.
   */
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

  /**
   * Consulta 2: Obtener información del cultivo asociado a la parcela (nombre, tipo, status).
   * Optimizada: Solo via id_cultivo, sin joins extras.
   */
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

  /**
   * Consulta 3: Obtener parámetros óptimos del cultivo asociado (params con min, max, optimal, etc.).
   * Optimizada: Directo desde Mongo via id_cultivo.
   */
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

  /**
   * Consulta 4: Obtener lista de IoTs asociados a la parcela (descripción, token, status, ultima_conexion).
   * Optimizada: Filtrado por id_parcela, solo campos relevantes.
   */
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

  /**
   * Consulta 5: Obtener lecturas recientes de la parcela (últimas N lecturas, default 5).
   * Optimizada: Slice en app para limitar, no en BD para simplicidad.
   */
  async getRecentReadings(idParcela: number, limit: number = 5) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    return data ? data.iotReadings.slice(-limit) : [];
  }

  /**
   * Consulta 6: Obtener lecturas por IoT específico en la parcela.
   * Optimizada: Filtrar en app después de fetch.
   */
  async getReadingsByIot(idParcela: number, idIot: number) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    return data ? data.iotReadings.filter((r) => r.id_iot === idIot) : [];
  }

  /**
   * Consulta 7: Obtener status general de lecturas recientes (conteo de 'bueno', 'alto', etc.).
   * Optimizada: Procesamiento en app sobre lecturas limitadas.
   */
  async getStatusSummary(idParcela: number, limit: number = 10) {
    const readings = await this.getRecentReadings(idParcela, limit);
    const statuses = readings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.status),
    );
    return statuses.reduce((acc: Record<string, number>, status) => {
      if (status == null) return acc;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Consulta 8: Obtener lecturas por sensor específico en la parcela.
   * Optimizada: Filtrar en app.
   */
  async getReadingsBySensor(idParcela: number, idSensor: number) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    return data
      ? data.iotReadings.flatMap((r) =>
          r.sensorReadings.filter((sr) => sr.id_sensor === idSensor),
        )
      : [];
  }

  /**
   * Consulta 9: Obtener promedios de lecturas por sensor (últimas N).
   * Optimizada: Cálculo en app.
   */
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

  /**
   * Consulta 10: Obtener lista de sensores en la parcela (via IoTs asociados).
   * Optimizada: Join mínimo con sensor_iot.
   */
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

  /**
   * Consulta 11: Obtener categorías de sensores en la parcela.
   * Optimizada: Basado en sensores de la parcela.
   */
  async getSensorCategoriesForParcela(idParcela: number) {
    const sensors = await this.getSensorsForParcela(idParcela);
    const sensorIds = sensors.map((s) => s.sensor.id_sensor);

    return this.prismaPostgres.sensor.findMany({
      where: { id_sensor: { in: sensorIds } },
    });
  }

  /**
   * Consulta 12: Obtener imágenes recientes de lecturas (últimas N URLs y results).
   * Optimizada: Slice en app.
   */
  async getRecentImages(idParcela: number, limit: number = 5) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    return data
      ? data.iotReadings.slice(-limit).map((r) => ({
          image_url: r.image_url,
          image_result: r.image_result,
        }))
      : [];
  }

  /**
   * Consulta 13: Obtener análisis de deviation por sensor (promedio de deviations en últimas N lecturas).
   * Optimizada: Cálculo en app.
   */
  async getDeviationAnalysis(
    idParcela: number,
    idSensor: number,
    limit: number = 10,
  ) {
    const readings = await this.getReadingsBySensor(idParcela, idSensor);
    const recent = readings.slice(-limit).filter((r) => r.deviation !== null);
    const sum = recent.reduce((acc, r) => acc + (r.deviation ?? 0), 0);
    return {
      averageDeviation: recent.length ? sum / recent.length : null,
      count: recent.length,
    };
  }

  /**
   * Consulta 14: Obtener conteo de statuses por tipo en la parcela (global).
   * Optimizada: Agregación en app sobre todas las lecturas.
   */
  async getGlobalStatusCount(idParcela: number) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    if (!data) return {};
    const statuses = data.iotReadings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.status),
    );
    return statuses.reduce(
      (acc: Record<string, number>, status) => {
        if (status == null) return acc;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  /**
   * Consulta 15: Obtener lecturas filtradas por status (e.g., solo 'alto' o 'bajo').
   * Optimizada: Filtrar en app.
   */
  async getReadingsByStatus(idParcela: number, targetStatus: string) {
    const data = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
      select: { iotReadings: true },
    });
    return data
      ? data.iotReadings.flatMap((r) =>
          r.sensorReadings.filter((sr) => sr.status === targetStatus),
        )
      : [];
  }
}
