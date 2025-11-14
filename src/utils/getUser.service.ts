import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';  // Asumiendo Express; ajusta si usas otro framework

/**
 * Función para extraer el ID del usuario del header de autorización (JWT).
 * @param req El objeto Request de Express (o similar) que contiene los headers.
 * @returns El ID del usuario decodificado del JWT.
 * @throws UnauthorizedException si el header es inválido o falta.
 */
export function getUserIdFromAuth(req: Request): number {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedException('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.decode(token) as any;  

  if (!decoded || !decoded.id) {
    throw new UnauthorizedException('Invalid token or missing user ID');
  }

  return decoded.id;  
}