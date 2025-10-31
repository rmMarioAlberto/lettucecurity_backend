// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest() as any;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    const roleMap: Record<number, string> = {
      1: 'user',
      2: 'admin',
      3: 'iot',
    };

    const userRole = roleMap[user.tipoUsuario];

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}
