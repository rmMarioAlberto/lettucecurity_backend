import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import {
  CreateParcelaDto,
  EditParcelaDto,
  GetDataParcela,
} from './dto/parcela.dto';
import jwt from 'jsonwebtoken';
import { PrismaServiceMongo } from 'src/prisma/prismaMongo.service';

@Injectable()
export class ParcelaService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly prismaMongo: PrismaServiceMongo,
  ) {}

  async getParcelasAll() {
    const parcelas = await this.prismaPostgres.parcela.findMany();

    return parcelas;
  }

  async getParcelasUser(accessToken: string) {
    const tokenDecode = jwt.decode(accessToken);

    const parcelas = this.prismaPostgres.parcela.findMany({
      where: { id_usuario: tokenDecode.id },
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

    const parcela = await this.prismaMongo.parcela_data.findUnique({
      where: { id_parcela: idParcela },
    });

    if (!parcela) {
      throw new NotFoundException(
        `No se encontró la parcela con ID ${idParcela}`,
      );
    }

    const iots = await this.prismaPostgres.iot.findMany({
      where: { id_parcela: idParcela },
    });

    const data = parcela.iotReadings.map((iotReading) => {
      const iotInfo = iots.find((i) => i.id_iot === iotReading.id_iot);

      return {
        id_iot: iotReading.id_iot,
        descripcion: iotInfo?.descripcion,
        hora: iotReading.hora,
        imagen: iotReading.image_url,
        sensores: iotReading.sensorReadings.map((sr) => ({
          id_sensor: sr.id_sensor,
          lectura: sr.lectura,
        })),
      };
    });

    return {
      id_parcela: idParcela,
      dispositivos: data,
    };
  }
}
