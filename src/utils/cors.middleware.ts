import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];
  private readonly allowAllOrigins: boolean;

  constructor() {
    // Configuración flexible de orígenes permitidos
    const corsOrigins = process.env.CORS_ORIGINS;

    if (corsOrigins === '*') {
      // Permitir todos los orígenes
      this.allowAllOrigins = true;
      this.allowedOrigins = [];
    } else if (corsOrigins) {
      // Lista específica de orígenes
      this.allowAllOrigins = false;
      this.allowedOrigins = corsOrigins
        .split(',')
        .map((origin) => origin.trim());
    } else {
      // Default: solo localhost en desarrollo
      this.allowAllOrigins = false;
      this.allowedOrigins = [
        'http://localhost:3000', // react
        'http://localhost:5173', // Vite
      ];
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;

    // Permitir todos los orígenes si está configurado
    if (this.allowAllOrigins) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    // Verificar si el origen está en la lista permitida
    else if (origin && this.allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    // Rechazar origen no permitido
    else if (origin && !this.allowAllOrigins) {
      throw new ForbiddenException(
        `Origen no permitido: ${origin}. Orígenes permitidos: ${this.allowedOrigins.join(', ')}`,
      );
    }

    // Headers CORS estándar
    res.header(
      'Access-Control-Allow-Methods',
      'GET,HEAD,OPTIONS,POST,PUT,DELETE,PATCH',
    );
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Session-Id, X-Nonce',
    );
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');

    // Manejar preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  }
}
