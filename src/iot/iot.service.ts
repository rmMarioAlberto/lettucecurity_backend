import { HttpStatus, Injectable } from '@nestjs/common';
import { AsignarParcelaDto, CreateIotDto, DeleteIot } from './dto/iotDto.dto';
import { PrismaServicePostgres } from 'src/prisma/prismaPosgres.service';

@Injectable()
export class IotService {
  constructor(private prismaPostgres: PrismaServicePostgres) {}

  async createIot(dto: CreateIotDto) {
    const { descripcion, fechaCreacion } = dto;
    const iot = await this.prismaPostgres.iot.create({
      data: { descripcion: descripcion, fecha_creacion: fechaCreacion },
    });
    return iot;
  }

  async getIots() {
    const iots = await this.prismaPostgres.iot.findMany();
    return iots;
  }

  async getIotsFree() {
    const iotsFree = await this.prismaPostgres.iot.findMany({
      where: { status: 1 },
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
    const { idIot, idParcela } = dto;
    const updateIot = await this.prismaPostgres.iot.update({
      where: { id_iot: idIot },
      data: { id_parcela: idParcela },
    });
    return updateIot;
  }
}
