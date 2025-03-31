import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

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
    private readonly usersService: UsersService,
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
    const userId = request.user.userId;

    // Получаем пользователя с его ролью
    const user = await this.usersService.findById(userId);

    // Проверяем наличие требуемой роли
    return requiredRoles.some(role => user.role === role);
  }
}