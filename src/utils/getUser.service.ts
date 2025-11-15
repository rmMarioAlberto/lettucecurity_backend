import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable() 
export class AuthUtilsService {
  constructor(private jwtService: JwtService) {} 
  /**
Función para extraer el ID del usuario de un access token.
@param token El access token JWT.
@returns El ID del usuario decodificado.
@throws UnauthorizedException si el token es inválido o falta ID.
*/
  getUserIdFromToken(token: string): number {
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }
    const decoded = this.jwtService.decode(token); 
    if (!decoded || typeof decoded !== 'object' || !decoded.id) {
      throw new UnauthorizedException('Invalid token or missing user ID');
    }
    return decoded.id;
  }
}
