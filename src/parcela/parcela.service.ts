import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { CreateParcelaDto, GetDataParcela } from './dto/parcela.dto';
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
    const { idParcela } = dto;

    const cycle = await this.prismaMongo.parcela_cycles.findFirst({
      where: { id_parcela: idParcela },
      orderBy: { startDate: 'desc' },
    });

    if (!cycle) {
      throw new NotFoundException(
        `No se encontró información de ciclos para la parcela ${idParcela}`,
      );
    }

    const allReadings = cycle.stages.flatMap((stage) => stage.readings);

    if (!allReadings.length) {
      return {
        id_parcela: idParcela,
        dispositivos: [],
      };
    }

    const iots = await this.prismaPostgres.iot.findMany({
      where: { id_parcela: idParcela },
    });

    const sensorIds = allReadings.flatMap((r) =>
      r.sensorReadings.map((sr) => sr.id_sensor),
    );

    const uniqueSensorIds = [...new Set(sensorIds)].map((n) => Number(n));

    const sensors = await this.prismaPostgres.sensor.findMany({
      where: { id_sensor: { in: uniqueSensorIds } },
      select: {
        id_sensor: true,
        nombre: true,
        unidad_medicion: true,
        modelo: true,
      },
    });

    const sensorMap = new Map(sensors.map((s) => [s.id_sensor, s]));

    const dispositivos = allReadings.map((iotReading) => {
      const iotInfo = iots.find((i) => i.id_iot === iotReading.id_iot);

      return {
        id_iot: iotReading.id_iot,
        descripcion: iotInfo?.descripcion,
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
    });

    return {
      id_parcela: idParcela,
      dispositivos,
    };
  }
}
