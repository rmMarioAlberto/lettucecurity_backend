import { Controller, Post, Body } from '@nestjs/common';
import { SkipCrypto } from './skip-crypto.decorator';
import { CryptoService } from './crypto.service';
import * as crypto from 'crypto';

@Controller('crypto')
export class CryptoHandshakeController {
  constructor(private readonly cryptoService: CryptoService) {}

  @SkipCrypto()
  @Post('handshake')
  handshake(@Body() body: { clientPublicKey: string }) {
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

    return {
      sessionId,
      serverPublicKey: serverECDH.getPublicKey('base64', 'compressed'),
      expiresInMs: 30 * 60_000,
    };
  }
}
