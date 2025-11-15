import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';

@Injectable()
export class TokensService {
  private readonly refreshSecret = process.env.JWT_REFRESH_TOKEN_CLAVE!;

  constructor(
    private jwtService: JwtService,
    private prismaPostgres: PrismaServicePostgres,
  ) {}

  async createAccessToken(user: any) {
    if (!user) throw new Error('User is required');
    const payload = { id: user.id_usuario, tipoUsuario: user.tipo_usuario };
    return this.jwtService.sign(payload);
  }

  async createRefreshToken(user: any) {
    if (!user) throw new Error('User is required');
    const payload = { id: user.id_usuario, tipoUsuario: user.tipo_usuario };
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: '30m',
    });
  }

  async validateAccessToken(token: string): Promise<any> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Access token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token signature');
      }
      throw new UnauthorizedException('Invalid access token');
    }

    const session = await this.prismaPostgres.sesion.findFirst({
      where: {
        token_acceso: token,
        id_usuario: payload.id,
        status: 1,
        revoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    if (new Date(session.fecha_expiracion) <= new Date()) {
      await this.prismaPostgres.sesion
        .delete({ where: { id_sesion: session.id_sesion } })
        .catch(() => {});
      throw new UnauthorizedException('Session expired');
    }

    return payload;
  }

  async validateRefreshToken(
    token: string,
  ): Promise<{
    payload: any;
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    let payload: any;
    try {
      payload = this.jwtService.verify(token, { secret: this.refreshSecret });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token signature');
      }
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await this.prismaPostgres.sesion.findFirst({
      where: {
        token_refresh: token,
        id_usuario: payload.id,
        status: 1,
        revoked: false,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or revoked');
    }

    if (new Date(session.fecha_expiracion) <= new Date()) {
      await this.prismaPostgres.sesion
        .delete({ where: { id_sesion: session.id_sesion } })
        .catch(() => {});
      throw new UnauthorizedException('Refresh token expired');
    }

    // NUEVO ACCESS TOKEN
    const newAccessToken = this.jwtService.sign(
      { id: payload.id, tipoUsuario: payload.tipoUsuario },
      { expiresIn: '15m' },
    );

    // NUEVO REFRESH TOKEN
    const newRefreshToken = this.jwtService.sign(
      { id: payload.id, tipoUsuario: payload.tipoUsuario },
      { secret: this.refreshSecret, expiresIn: '30m' },
    );

    // ACTUALIZAR TODO EN LA SESIÓN
    await this.prismaPostgres.sesion.update({
      where: { id_sesion: session.id_sesion },
      data: {
        token_acceso: newAccessToken,
        token_refresh: newRefreshToken,
        fecha_expiracion: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    return { payload, newAccessToken, newRefreshToken };
  }

  async revokeSession(userId: number, token: string) {
    const session = await this.prismaPostgres.sesion.findFirst({
      where: { id_usuario: userId, token_acceso: token },
    });
    if (session) {
      await this.prismaPostgres.sesion.update({
        where: { id_sesion: session.id_sesion },
        data: { revoked: true, status: 0 },
      });
    }
  }
}
