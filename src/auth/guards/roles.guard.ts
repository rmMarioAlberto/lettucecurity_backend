import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
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

    const request = context.switchToHttp().getRequest();
    const user = request.user; 

    if (!user || !user.tipoUsuario) {
      throw new ForbiddenException('User not found or invalid in request');
    }

    const roleMap: Record<number, string> = {
      1: 'user',
      2: 'admin',
      3: 'iot',
    };

    const userRole = roleMap[user.tipoUsuario];
    if (!userRole) {
      throw new ForbiddenException('Invalid user type');
    }

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Access denied: insufficient permissions');
    }

    return true;
  }
}