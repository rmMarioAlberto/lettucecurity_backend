import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccessService } from './access.service';
import { AccessLoginDto } from './dto/access.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @HttpCode(HttpStatus.OK)
  async login(@Body() accessLoginDto: AccessLoginDto, @Req() req: Request) {
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.accessService.loginUser(accessLoginDto, clientIp, userAgent);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login exitoso',
      ...result,
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
  async logout(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    await this.accessService.logoutUser(token);

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
        refreshToken: 'nuevo-refresh-token...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token inválido o expirado' })
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const newTokens = await this.accessService.refreshToken(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      ...newTokens,
    };
  }
}
