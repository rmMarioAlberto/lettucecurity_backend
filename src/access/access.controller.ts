import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AccessService } from './access.service';
import {
  AccessLoginDto,
  AccessLogoutDto,
  AccessRefreshTokenDto,
} from './dto/access.dto';

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
  async logout(@Body() logoutDto: AccessLogoutDto) {
    await this.accessService.logoutUser(logoutDto.refreshToken);

    return {
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully',
    };
  }

  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() accessRefreshTokenDto: AccessRefreshTokenDto) {
    const newTokens = await this.accessService.refreshToken(
      accessRefreshTokenDto.refreshToken,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed successfully',
      ...newTokens,
    };
  }
}
