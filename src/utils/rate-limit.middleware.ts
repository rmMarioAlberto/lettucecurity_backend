import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  lastRequest: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly requests: Map<string, RateLimitRecord> = new Map();
  private readonly windowMs = 60 * 1000; 
  private readonly maxRequests = 20; 

  constructor() {
    // Limpiar registros antiguos cada 5 minutos
    setInterval(() => {
      const now = Date.now();
      for (const [ip, record] of this.requests.entries()) {
        if (now - record.lastRequest > this.windowMs) {
          this.requests.delete(ip);
        }
      }
    }, 5 * 60 * 1000);
  }

  use = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? req.connection?.remoteAddress ?? req.socket?.remoteAddress ?? 'unknown';
    const now = Date.now();

    const record = this.requests.get(ip);

    if (record) {
      const elapsed = now - record.lastRequest;

      if (elapsed > this.windowMs) {
        this.requests.set(ip, { count: 1, lastRequest: now });
      } else {
        if (record.count >= this.maxRequests) {
          throw new HttpException(
            `Demasiadas peticiones. Intenta nuevamente en ${Math.ceil(
              (this.windowMs - elapsed) / 1000,
            )} segundos.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        record.count++;
        record.lastRequest = now;
      }
    } else {
      this.requests.set(ip, { count: 1, lastRequest: now });
    }

    next();
  }
}