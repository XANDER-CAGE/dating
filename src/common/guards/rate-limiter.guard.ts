import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Reflector } from '@nestjs/core';
  import { Request } from 'express';
  import { RedisService } from '../services/redis.service';
  
  // Расширяем интерфейс Request для поддержки свойства user
  declare global {
    namespace Express {
      interface Request {
        user?: {
          userId: string;
          email: string;
        };
      }
    }
  }
  
  export interface RateLimitOptions {
    points: number;     // Максимальное количество запросов
    duration: number;   // Период времени в секундах
    keyPrefix?: string; // Префикс для ключа в Redis
  }
  
  export const RATE_LIMIT_KEY = 'rate_limit';
  
  export function RateLimit(options: RateLimitOptions) {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, target, key);
      return descriptor;
    };
  }
  
  @Injectable()
  export class RateLimiterGuard implements CanActivate {
    constructor(
      private readonly reflector: Reflector,
      private readonly redisService: RedisService,
      private readonly configService: ConfigService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const rateLimitOptions = this.reflector.get<RateLimitOptions>(
        RATE_LIMIT_KEY,
        context.getHandler(),
      );
  
      if (!rateLimitOptions) {
        return true; // Если ограничение не задано, пропускаем запрос
      }
  
      const request = context.switchToHttp().getRequest<Request>();
      
      // Получаем IP и путь для создания уникального ключа
      const ip = request.ip;
      const path = request.path;
      
      // Получаем ID пользователя, если аутентифицирован
      const userId = request.user?.userId;
      
      // Создаем ключ для Redis на основе IP, пути и ID пользователя
      const keyPrefix = rateLimitOptions.keyPrefix || 'rate_limit';
      const key = userId 
        ? `${keyPrefix}:${userId}:${path}`
        : `${keyPrefix}:${ip}:${path}`;
      
      // Получаем текущее количество запросов
      const current = await this.redisService.incrementRateLimit(key, rateLimitOptions.duration);
      
      // Если превышает лимит, выбрасываем исключение
      if (current > rateLimitOptions.points) {
        throw new HttpException(
          'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      
      return true;
    }
  }