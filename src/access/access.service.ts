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
        revoked: false,
      },
    });
    const returnUser = {
      id_usuario: findUser.id_usuario,
      username: findUser.username,
      correo: findUser.correo,
      nombre: findUser.nombre,
      apellido: findUser.apellido,
      tipo_usuario: findUser.tipo_usuario,
    };
    return {
      accessToken,
      refreshToken,
      user: returnUser,
    };
  }

  async logoutUser(token: string) {
    let payload;
    try {
      payload = await this.tokensService.validateAccessToken(token);
    } catch {
      const refreshResult =
        await this.tokensService.validateRefreshToken(token);
      payload = refreshResult.payload;
    }
    // Revoca sesión
    await this.tokensService.revokeSession(payload.id, token);
    return { message: 'Session closed' };
  }

  async refreshToken(refreshToken: string) {
    const { payload, newAccessToken, newRefreshToken } =
      await this.tokensService.validateRefreshToken(refreshToken);

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
