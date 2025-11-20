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
    // Intentar decodificar el token para obtener el userId
    // NO validamos porque validateRefreshToken actualiza la sesión
    const decoded = this.tokensService.decodeTokenUnsafe(token);

    if (!decoded || !decoded.id) {
      throw new UnauthorizedException(
        'No se pudo identificar la sesión a cerrar',
      );
    }

    const userId: number = decoded.id;

    // Eliminar la sesión directamente por refresh token
    await this.tokensService.revokeSessionByRefreshToken(userId, token);

    // Limpiar sesiones expiradas del usuario
    await this.cleanUserExpiredSessions(userId);

    return { message: 'Session closed' };
  }

  async refreshToken(refreshToken: string) {
    const { payload, newAccessToken, newRefreshToken } =
      await this.tokensService.validateRefreshToken(refreshToken);

    // Limpiar sesiones expiradas del usuario después del refresh
    await this.cleanUserExpiredSessions(payload.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Limpia sesiones expiradas de un usuario específico
   */
  private async cleanUserExpiredSessions(userId: number) {
    try {
      const now = new Date();
      await this.prismaPostgres.sesion.deleteMany({
        where: {
          id_usuario: userId,
          OR: [
            { fecha_expiracion: { lte: now } },
            { revoked: true },
            { status: 0 },
          ],
        },
      });
    } catch (error) {
      console.error(`Error limpiando sesiones del usuario ${userId}:`, error);
    }
  }

  /**
   * Limpia todas las sesiones expiradas, revocadas o inactivas del sistema
   * Esta función debe ser llamada periódicamente por un cron job
   */
  async cleanSessiones() {
    try {
      const now = new Date();
      const deletedSessions = await this.prismaPostgres.sesion.deleteMany({
        where: {
          OR: [
            { fecha_expiracion: { lte: now } }, // Sesiones expiradas
            { revoked: true }, // Sesiones revocadas
            { status: 0 }, // Sesiones inactivas
          ],
        },
      });

      const message = `Sesiones limpiadas: ${deletedSessions.count}`;
      console.log(message);

      return {
        success: true,
        deletedCount: deletedSessions.count,
        message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error limpiando sesiones:', error);
      throw error;
    }
  }
}
