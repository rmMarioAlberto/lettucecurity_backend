import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken'; 
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';

@Injectable()
export class TokensIotService {
  constructor(private readonly prismaPostgres: PrismaServicePostgres) {}

  async generateTokenIot(id_iot: number) {
    if (!id_iot) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'El id de iot no se recuperó correctamente',
      };
    }
    const iot = await this.prismaPostgres.iot.findUnique({ where: { id_iot } });
    if (!iot) {
      return { statusCode: HttpStatus.NOT_FOUND, message: 'IoT no encontrado' };
    }
    const jwtToken = jwt.sign(
      { id_iot, tipoUsuario: 3 },
      process.env.JWT_SECRET_KEY_IOT,
      { expiresIn: '365d' },
    );
    return { statusCode: HttpStatus.OK, token: jwtToken };
  }

  async validateTokenIot(token: string) {
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET_KEY_IOT) as {
        id_iot: number;
      };
      const findToken = await this.prismaPostgres.iot.findUnique({
        where: { id_iot: payload.id_iot, token: token },
      });
      if (!findToken) {
        throw new UnauthorizedException('Token inválido');
      }
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }
}
