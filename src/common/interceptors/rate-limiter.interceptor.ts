import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { Reflector } from '@nestjs/core';
  import { Observable } from 'rxjs';
  import { RedisService } from '../services/redis.service';
  import { RateLimitOptions, RATE_LIMIT_KEY } from '../guards/rate-limiter.guard';
  
  @Injectable()
  export class RateLimiterInterceptor implements NestInterceptor {
    constructor(
      private readonly reflector: Reflector,
      private readonly redisService: RedisService,
      private readonly configService: ConfigService,
    ) {}
  
    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const rateLimitOptions = this.reflector.get<RateLimitOptions>(
        RATE_LIMIT_KEY,
        context.getHandler(),
      );
  
      if (!rateLimitOptions) {
        return next.handle();
      }
  
      const request = context.switchToHttp().getRequest();
      
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
      
      // Добавляем заголовки с информацией о лимите запросов
      const response = context.switchToHttp().getResponse();
      response.header('X-RateLimit-Limit', rateLimitOptions.points);
      response.header('X-RateLimit-Remaining', Math.max(0, rateLimitOptions.points - current));
      
      // Получаем время истечения ключа (TTL в секундах)
      const ttl = await this.redisService.getClient().ttl(key);
      response.header('X-RateLimit-Reset', ttl);
      
      return next.handle();
    }
  }