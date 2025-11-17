import { Module } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { CryptoHandshakeController } from './crypto.controller';
import { CryptoInterceptor } from './crypto.interceptor';
import { Reflector } from '@nestjs/core';

@Module({
  providers: [CryptoService, CryptoInterceptor, Reflector],
  controllers: [CryptoHandshakeController],
  exports: [CryptoService, CryptoInterceptor],
})
export class CryptoModule {}
