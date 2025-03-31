import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisService } from './services/redis.service';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { User } from '../users/entities/user.entity';
import { RateLimiterGuard } from './guards/rate-limiter.guard';
import { RateLimiterInterceptor } from './interceptors/rate-limiter.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HttpExceptionFilter } from './filters/http-exception.filter';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    RedisService,
    NotificationsService,
    RateLimiterGuard,
    RateLimiterInterceptor,
    TransformInterceptor,
    HttpExceptionFilter,
  ],
  controllers: [NotificationsController],
  exports: [
    RedisService,
    NotificationsService,
    RateLimiterGuard,
    RateLimiterInterceptor,
    TransformInterceptor,
    HttpExceptionFilter,
  ],
})
export class CommonModule {}