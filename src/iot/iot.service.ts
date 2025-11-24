import { HttpStatus, Injectable } from '@nestjs/common';
import { AsignarParcelaDto, CreateIotDto, DeleteIot } from './dto/iotDto.dto';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { TokensIotService } from '../tokens/tokensIot.service';

@Injectable()
export class IotService {
  constructor(
    private readonly prismaPostgres: PrismaServicePostgres,
    private readonly tokenService: TokensIotService,
  ) {}

  async createIot(dto: CreateIotDto) {
    const { descripcion, fechaCreacion } = dto;
    let newIot = await this.prismaPostgres.iot.create({
      data: { descripcion: descripcion, fecha_creacion: fechaCreacion },
    });
    const tokenIot = await this.tokenService.generateTokenIot(newIot.id_iot);

    newIot = await this.prismaPostgres.iot.update({
      where: { id_iot: newIot.id_iot },
      data: { token: tokenIot.token },
    });
    return newIot;
  }

  async getIots() {
    const iots = await this.prismaPostgres.iot.findMany({
      include: { sensor_iot: true },
    });
    return iots;
  }

  async getIotsFree() {
    const iotsFree = await this.prismaPostgres.iot.findMany({
      where: {
        status: 1,
        parcela: null,
        coordenada_x: null,
        coordenada_y: null,
      },
    });

    return iotsFree;
  }

  async deleteIot(dto: DeleteIot) {
    const { idIot } = dto;
    const deleteIot = await this.prismaPostgres.iot.delete({
      where: { id_iot: idIot },
    });
    return deleteIot;
  }

  async asignarParcela(dto: AsignarParcelaDto) {
    const { idIot, idParcela, coordenadaX, coordenadaY } = dto;
    const updateIot = await this.prismaPostgres.iot.update({
      where: { id_iot: idIot },
      data: {
        id_parcela: idParcela,
        coordenada_x: coordenadaX,
        coordenada_y: coordenadaY,
      },
    });
    return updateIot;
  }
}
