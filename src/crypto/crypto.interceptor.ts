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
  constructor(private readonly reflector: Reflector, private readonly cryptoService: CryptoService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CRYPTO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    if (skip) return next.handle();

    if (req.body && req.body.sessionId && req.body.cipherText && req.body.iv && req.body.tag) {
      const sessionId = req.body.sessionId;
      const aesKey = this.cryptoService.getKey(sessionId);
      if (!aesKey) {
        throw new BadRequestException('Invalid or expired sessionId (crypto)');
      }
      try {
        const plain = this.cryptoService.decryptWithKey(aesKey, req.body.cipherText, req.body.iv, req.body.tag);
        req.body = JSON.parse(plain);
        req.__crypto_sessionId = sessionId;
      } catch (err) {
        throw new BadRequestException('Failed to decrypt payload');
      }
    } else {
      throw new BadRequestException(
        'Encrypted payload required. Please perform handshake at POST /crypto/handshake first.'
      );
    }

    return next.handle().pipe(
      map((responseBody) => {
        const sessionId = req.__crypto_sessionId;
        if (!sessionId) return responseBody;

        const aesKey = this.cryptoService.getKey(sessionId);
        if (!aesKey) {
          return { error: 'Crypto session expired' };
        }

        const encrypted = this.cryptoService.encryptWithKey(aesKey, JSON.stringify(responseBody));
        return {
          sessionId,
          cipherText: encrypted.cipherText,
          iv: encrypted.iv,
          tag: encrypted.tag,
        };
      }),
    );
  }
}