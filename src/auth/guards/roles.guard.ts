import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';

export function Roles(...roles: UserRole[]) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(ROLES_KEY, roles, target, key);
    return descriptor;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Если пользователь не аутентифицирован, отклоняем запрос
    if (!user) {
      return false;
    }

    // Для разработки: считаем, что пользователь имеет роль ADMIN
    // В реальном приложении здесь должна быть логика проверки роли пользователя
    return true; // Временное решение для разработки
  }
}
