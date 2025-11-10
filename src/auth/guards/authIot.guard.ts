import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokensIotService } from '../../tokens/tokensIot.service';

@Injectable()
export class AuthIotGuard implements CanActivate {
  constructor(private readonly tokensService: TokensIotService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token = authHeader.split(' ')[1];
    const payload = await this.tokensService.validateTokenIot(token); // Si falla, throwea auto
    request['user'] = payload; // Usa request['user'] en lugar de (request as any).user para mejor typing
    return true;
  }
}
