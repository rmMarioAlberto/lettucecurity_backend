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
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiResponse({
    status: 200,
    description: 'Tokens generados correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Login exitoso',
        data: { accessToken: '', user: {} },
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
  @ApiOperation({ summary: 'Cerrar sesión del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Sesión cerrada correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Logged out successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o faltante' })
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    const token = authHeader.split(' ')[1];
    await this.accessService.logoutUser(token);
    res.clearCookie('refreshToken');
    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }
  @Get('refreshToken')
  @ApiOperation({ summary: 'Actualizar tokens (access y refresh)' })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados correctamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Tokens refreshed successfully',
        accessToken: 'nuevo-access-token...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
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
