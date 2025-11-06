import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaServicePostgres } from '../prisma/prismaPosgres.service';
import { AccessLoginDto } from './dto/access.dto';
import * as bcrypt from 'bcrypt';
import { TokensService } from '../tokens/tokens.service';

@Injectable()
export class AccessService {
  constructor(
    private prismaPostgres: PrismaServicePostgres,
    private tokensService: TokensService,
  ) {}

  async loginUser(
    userLogin: AccessLoginDto,
    clientIp?: string,
    userAgent?: string,
  ) {
    const findUser = await this.prismaPostgres.usuario.findUnique({
      where: { correo: userLogin.correo },
    });

    if (!findUser) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      userLogin.contra,
      findUser.contra,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const accessToken = await this.tokensService.createAccessToken(findUser);
    const refreshToken = await this.tokensService.createRefreshToken(findUser);

    const now = new Date();
    const expirationDate = new Date(now.getTime() + 30 * 60000);

    const retrunUser = {
      id_usuario : findUser.id_usuario,
      username : findUser.username,
      correo : findUser.correo,
      nombre : findUser.nombre,
      apellido : findUser.apellido,
      tipo_usuario : findUser.tipo_usuario,
    }

    await this.prismaPostgres.sesion.create({
      data: {
        id_usuario: findUser.id_usuario,
        token_acceso: accessToken,
        token_refresh: refreshToken,
        ip_cliente: clientIp || 'unknown',
        user_agent: userAgent || 'unknown',
        fecha_creacion: now,
        fecha_expiracion: expirationDate,
        status: 1,
      },
    });

    return {
      accessToken,
      refreshToken,
      user : retrunUser
    };
  }

  async logoutUser(refreshToken: string) {
    await this.tokensService.validateRefreshToken(refreshToken);

    const result = await this.prismaPostgres.sesion.deleteMany({
      where: { token_refresh: refreshToken, status: 1 },
    });

    if (result.count === 0) {
      throw new UnauthorizedException('Session already closed or not found');
    }

    this.cleanSessiones().catch((error) => {
      console.error('[Background] cleanSessiones failed:', error.message);
    });

    return { message: 'Session closed' };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.tokensService.validateRefreshToken(refreshToken);

    const user = await this.prismaPostgres.usuario.findFirst({
      where: { id_usuario: payload.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const newAccessToken = await this.tokensService.createAccessToken(user);
    const newRefreshToken = await this.tokensService.createRefreshToken(user);

    await this.prismaPostgres.sesion.updateMany({
      where: {
        token_refresh: refreshToken,
        id_usuario: user.id_usuario,
      },
      data: {
        token_acceso: newAccessToken,
        token_refresh: newRefreshToken,
        fecha_expiracion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async cleanSessiones() {
    try {
      const now = new Date();

      const deletedSessions = await this.prismaPostgres.sesion.deleteMany({
        where: {
          AND: [{ status: 1 }, { fecha_expiracion: { lte: now } }],
        },
      });

      console.log(`Sesiones limpiadas: ${deletedSessions.count}`);
      return deletedSessions;
    } catch (error) {
      console.error('Error limpiando sesiones:', error);
      throw error;
    }
  }
}
