import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { SkipCrypto } from './skip-crypto.decorator';
import { CryptoService } from './crypto.service';
import * as crypto from 'crypto';
import express from 'express';

@Controller('crypto')
export class CryptoHandshakeController {
  constructor(private readonly cryptoService: CryptoService) {}

  @SkipCrypto()
  @Post('handshake')
  handshake(@Body() body: { clientPublicKey: string }, @Req() req: express.Request) {
    if (!body?.clientPublicKey) {
      return { error: 'clientPublicKey required' };
    }

    // Crear ECDH con curva correcta
    const serverECDH = crypto.createECDH('prime256v1');
    serverECDH.generateKeys();

    // LEER CLAVE DEL CLIENTE EN FORMATO COMPRIMIDO
    const clientPub = Buffer.from(body.clientPublicKey, 'base64');

    // indicar formato
    const sharedSecret = serverECDH.computeSecret(clientPub);

    const aesKey = this.cryptoService.deriveAesKey(sharedSecret);
    const sessionId = crypto.randomUUID();

    this.cryptoService.storeKey(sessionId, aesKey, 30 * 60_000);

    // Auditoría
    const clientIp = req.ip || 'unknown';
    console.log(`[CRYPTO] New session ${sessionId} from ${clientIp}`);

    return {
      sessionId,
      serverPublicKey: serverECDH.getPublicKey('base64', 'compressed'),
      expiresInMs: 30 * 60_000,
      maxRequests: 1000, // NUEVO: Informar límite de requests
      rotateAfter: 500, // NUEVO: Sugerir rotación después de N requests
    };
  }

  @SkipCrypto()
  @Post('rotate')
  async rotateKey(
    @Body() body: { sessionId: string; clientPublicKey: string },
  ) {
    if (!body?.sessionId || !body?.clientPublicKey) {
      throw new BadRequestException('sessionId and clientPublicKey required');
    }

    // Verificar que la sesión existe (esto también incrementa el contador)
    const stats = this.cryptoService.getSessionStats(body.sessionId);
    if (!stats) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    // Generar nuevo par ECDH
    const serverECDH = crypto.createECDH('prime256v1');
    serverECDH.generateKeys();

    // Calcular nuevo shared secret
    const clientPub = Buffer.from(body.clientPublicKey, 'base64');
    const sharedSecret = serverECDH.computeSecret(clientPub);
    const newAesKey = this.cryptoService.deriveAesKey(sharedSecret);

    // Rotar clave
    const rotated = this.cryptoService.rotateKey(body.sessionId, newAesKey);

    if (!rotated) {
      throw new InternalServerErrorException('Failed to rotate key');
    }

    return {
      sessionId: body.sessionId,
      serverPublicKey: serverECDH.getPublicKey('base64', 'compressed'),
      rotated: true,
      message: 'Key rotated successfully. Request counter reset to 0.',
    };
  }

  @SkipCrypto()
  @Get('stats/:sessionId')
  getStats(@Param('sessionId') sessionId: string) {
    const stats = this.cryptoService.getSessionStats(sessionId);

    if (!stats) {
      throw new NotFoundException('Session not found');
    }

    return {
      ...stats,
      ageSeconds: Math.floor(stats.age / 1000),
      ttlSeconds: Math.floor(stats.ttl / 1000),
    };
  }
}
