import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccessService } from './access.service';
import { AccessLoginDto } from './dto/access.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
@Controller('auth')
@ApiTags('Autenticación')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}
  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión de usuario',
    description:
      'Autentica al usuario con correo y contraseña. Retorna el access token en la respuesta y guarda el refresh token en una cookie httpOnly segura.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Login exitoso. Access token en la respuesta, refresh token en cookie httpOnly',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login exitoso',
        data: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id_usuario: 1,
            username: 'usuario123',
            correo: 'usuario@example.com',
            nombre: 'Juan',
            apellido: 'Pérez',
            tipo_usuario: 2,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() accessLoginDto: AccessLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];
    const result = await this.accessService.loginUser(
      accessLoginDto,
      clientIp,
      userAgent,
    );

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Login exitoso',
      data: { accessToken: result.accessToken, user: result.user },
    };
  }
  @Delete('logout')
  @ApiOperation({
    summary: 'Cerrar sesión del usuario',
    description:
      'Cierra la sesión del usuario eliminando el registro de la base de datos y limpiando la cookie. Usa el refresh token almacenado en cookies para identificar la sesión. También limpia automáticamente sesiones expiradas del usuario.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Sesión cerrada correctamente. La sesión fue eliminada de la BD y la cookie fue limpiada',
    schema: {
      example: {
        statusCode: 200,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token faltante en cookies o inválido',
  })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token in cookies');
    }

    await this.accessService.logoutUser(refreshToken);
    res.clearCookie('refreshToken');

    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }
  @Get('refreshToken')
  @ApiOperation({
    summary: 'Renovar tokens de acceso',
    description:
      'Genera nuevos access y refresh tokens usando el refresh token almacenado en cookies. Actualiza la sesión en la BD con los nuevos tokens y limpia automáticamente sesiones expiradas del usuario.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Tokens renovados correctamente. Nuevo access token en la respuesta, nuevo refresh token en cookie',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tokens refreshed successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token faltante, inválido, expirado o sesión revocada',
  })
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const newTokens = await this.accessService.refreshToken(refreshToken);
    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });
    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      accessToken: newTokens.accessToken,
    };
  }
}
