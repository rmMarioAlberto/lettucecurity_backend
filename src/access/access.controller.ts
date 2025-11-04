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
import { AccessLoginDto} from './dto/access.dto';

@Controller('auth')
export class AccessController {
  constructor(private accessService: AccessService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() accessLoginDto: AccessLoginDto, @Req() req: Request) {
    const clientIp = req.ip;
    const userAgent = req.headers['user-agent'];

    const result = await this.accessService.loginUser(
      accessLoginDto,
      clientIp,
      userAgent,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Login exitoso',
      ...result,
    };
  }

  @Delete('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];

    await this.accessService.logoutUser(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  @Get('refreshToken')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Req() req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
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
