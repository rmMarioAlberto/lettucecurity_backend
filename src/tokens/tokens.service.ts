import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';

dotenv.config();

@Injectable()
export class TokensService {
  private readonly accessSecret = process.env.JWT_ACCESS_TOKEN_CLAVE!;
  private readonly refreshSecret = process.env.JWT_REFRESH_TOKEN_CLAVE!;
  constructor(private prismaPostgres: PrismaServicePostgres) {}

  private signToken(payload: object, secret: string, expiresIn: string) {
    if (!secret) {
      throw new Error('JWT secret key is missing');
    }

    return jwt.sign(payload, secret, { expiresIn });
  }

  async createAccessToken(user: any) {
    if (!user) {
      throw new Error('User is required');
    }

    const payload = {
      id: user.id_usuario,
      username: user.nombre ?? 'Sin nombre',
      tipoUsuario: user.tipo_usuario,
    };

    return this.signToken(payload, this.accessSecret, '15m');
  }

  async createRefreshToken(user: any) {
    if (!user) {
      throw new Error('User is required');
    }

    const payload = {
      id: user.id_usuario,
      username: user.nombre ?? 'Sin nombre',
      tipoUsuario: user.tipo_usuario,
    };

    return this.signToken(payload, this.refreshSecret, '30m');
  }

async validateAccessToken(token: string): Promise<any> {
  let payload: any;
  
  try {
    payload = jwt.verify(token, this.accessSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Access token expired');
    }
    throw new UnauthorizedException('Invalid access token');
  }

  const session = await this.prismaPostgres.sesion.findFirst({
    where: {
      token_acceso: token,
      id_usuario: payload.id,
      status: 1,
    },
  });

  if (!session) {
    throw new UnauthorizedException('Session not found');
  }

  if (new Date(session.fecha_expiracion) <= new Date()) {
    await this.prismaPostgres.sesion.delete({
      where: { id_sesion: session.id_sesion },
    }).catch(() => {}); 
    throw new UnauthorizedException('Session expired');
  }

  return payload;
}

async validateRefreshToken(token: string): Promise<any> {
  let payload: any;
  
  try {
    payload = jwt.verify(token, this.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedException('Refresh token expired');
    }
    throw new UnauthorizedException('Invalid refresh token');
  }

  const session = await this.prismaPostgres.sesion.findFirst({
    where: {
      token_refresh: token,
      id_usuario: payload.id,
      status: 1,
    },
  });

  if (!session) {
    throw new UnauthorizedException('Session not found');
  }

  if (new Date(session.fecha_expiracion) <= new Date()) {
    await this.prismaPostgres.sesion.delete({
      where: { id_sesion: session.id_sesion },
    }).catch(() => {}); 
    throw new UnauthorizedException('Refresh token expired');
  }

  return payload;
}



}
