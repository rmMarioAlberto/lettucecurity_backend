import {
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  lastRequest: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly requests: Map<string, RateLimitRecord> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly skipSuccessfulRequests: boolean;
  private readonly skipFailedRequests: boolean;

  constructor() {
    // Configuración desde variables de entorno
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'); // 1 minuto por defecto
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'); // 100 requests por defecto
    this.skipSuccessfulRequests =
      process.env.RATE_LIMIT_SKIP_SUCCESS === 'true';
    this.skipFailedRequests = process.env.RATE_LIMIT_SKIP_FAILED === 'true';

    // Limpiar registros antiguos cada 5 minutos
    setInterval(
      () => {
        this.cleanupOldRecords();
      },
      5 * 60 * 1000,
    );

    this.logger.log(
      `Rate limit configurado: ${this.maxRequests} requests por ${this.windowMs / 1000} segundos`,
    );
  }

  use = (req: Request, res: Response, next: NextFunction) => {
    // Obtener identificador único (IP)
    const identifier = this.getIdentifier(req);
    const now = Date.now();

    // Obtener o crear registro
    let record = this.requests.get(identifier);

    if (!record || now > record.resetTime) {
      // Crear nuevo registro o resetear
      record = {
        count: 0,
        lastRequest: now,
        resetTime: now + this.windowMs,
      };
      this.requests.set(identifier, record);
    }

    // Incrementar contador
    record.count++;
    record.lastRequest = now;

    // Verificar límite
    if (record.count > this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      // Headers de rate limit
      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
      res.setHeader('Retry-After', retryAfter.toString());

      this.logger.warn(
        `Rate limit excedido para ${identifier}. Retry after ${retryAfter}s`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Demasiadas peticiones. Intenta nuevamente en ${retryAfter} segundos.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Agregar headers informativos
    const remaining = Math.max(0, this.maxRequests - record.count);
    res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    next();
  };

  private getIdentifier(req: Request): string {
    // Priorizar header X-Forwarded-For (para proxies/load balancers)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor.split(',')[0];
      return ips.trim();
    }

    // Fallback a req.ip
    return (
      req.ip ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      'unknown'
    );
  }

  private cleanupOldRecords() {
    const now = Date.now();
    let cleaned = 0;

    for (const [identifier, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(identifier);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Limpiados ${cleaned} registros de rate limit`);
    }
  }

  /**
   * Método público para resetear el rate limit de un identificador específico
   * Útil para testing o casos especiales
   */
  public reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Método público para obtener estadísticas
   */
  public getStats(): {
    totalTracked: number;
    windowMs: number;
    maxRequests: number;
  } {
    return {
      totalTracked: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
    };
  }
}
