import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaServicePostgres } from 'src/prisma/prismaPosgres.service';
import { CreateParcelaDto, EditParcelaDto } from './dto/parcela.dto';
import jwt from 'jsonwebtoken';

@Injectable()
export class ParcelaService {
  constructor(private prismaPostgres: PrismaServicePostgres) {}

  //get todas las parcelas (admin)
  async getParcelasAll() {
    const parcelas = await this.prismaPostgres.parcela.findMany();

    return parcelas;
  }

  //get todas las parcelas (user)
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

  //editar parcela (admin)
  async editParcela(editParcelaDto: EditParcelaDto) {}
}
