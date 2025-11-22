// src/crypto/crypto.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { SKIP_CRYPTO_KEY } from './skip-crypto.decorator';
import { CryptoService } from './crypto.service';

@Injectable()
export class CryptoInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly cryptoService: CryptoService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CRYPTO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest();

    let sessionId: string;
    let nonce: number;

    // 1. Intentar leer del Body (para POST, PUT, PATCH)
    if (
      req.body?.sessionId &&
      req.body?.cipherText &&
      req.body?.iv &&
      req.body?.tag &&
      typeof req.body?.nonce === 'number'
    ) {
      sessionId = req.body.sessionId;
      nonce = req.body.nonce;
      const { cipherText, iv, tag } = req.body;

      // Obtener clave AES
      const aesKey = this.cryptoService.getKey(sessionId);
      if (!aesKey) {
        throw new BadRequestException('Invalid or expired sessionId (crypto)');
      }

      // Validar nonce para prevenir replay attacks
      if (!this.cryptoService.validateNonce(sessionId, nonce)) {
        throw new BadRequestException('Invalid nonce (possible replay attack)');
      }

      // Descifrar payload
      try {
        const plain = this.cryptoService.decryptWithKey(
          aesKey,
          cipherText,
          iv,
          tag,
        );
        req.body = JSON.parse(plain);
        req.__crypto_sessionId = sessionId;
      } catch (err) {
        throw new BadRequestException('Failed to decrypt payload');
      }
    }
    // 2. Intentar leer Headers (para GET, DELETE)
    else if (req.headers['x-session-id']) {
      sessionId = req.headers['x-session-id'] as string;
      const nonceHeader = req.headers['x-nonce'];
      nonce = Number(nonceHeader);

      if (!sessionId || isNaN(nonce)) {
        throw new BadRequestException('Invalid Session Headers');
      }

      // Obtener clave AES (para validar que la sesión existe)
      const aesKey = this.cryptoService.getKey(sessionId);
      if (!aesKey) {
        throw new BadRequestException('Invalid or expired sessionId (crypto)');
      }

      // Validar nonce
      if (!this.cryptoService.validateNonce(sessionId, nonce)) {
        throw new BadRequestException('Invalid nonce (possible replay attack)');
      }
    } else {
      throw new BadRequestException(
        'Encrypted payload or Session Headers required. Please perform handshake at POST /crypto/handshake first.',
      );
    }

    // Guardar sessionId para usarlo al encriptar la respuesta
    req['__crypto_sessionId'] = sessionId;

    // Cifrar respuesta
    return next.handle().pipe(
      map((responseBody) => {
        const sessionId = req['__crypto_sessionId'];
        if (!sessionId) return responseBody;

        const aesKey = this.cryptoService.getKey(sessionId);
        if (!aesKey) {
          return { error: 'Crypto session expired' };
        }

        const encrypted = this.cryptoService.encryptWithKey(
          aesKey,
          JSON.stringify(responseBody),
        );

        // Obtener estadísticas de la sesión para sugerir siguiente nonce
        const stats = this.cryptoService.getSessionStats(sessionId);

        return {
          sessionId,
          cipherText: encrypted.cipherText,
          iv: encrypted.iv,
          tag: encrypted.tag,
          nextNonce: stats ? stats.lastNonce + 1 : 1, // Sugerir siguiente nonce
        };
      }),
    );
  }
}
