import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private redisSubscriber: Redis | null = null; // Изменяем инициализацию

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Инициализация Redis клиента
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: 'dating_app:',
    });

    // Инициализация Redis подписчика для pub/sub системы
    this.redisSubscriber = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: 'dating_app:',
    });

    // Обработка ошибок подключения
    this.redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.redisSubscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
    });

    console.log('Redis service initialized');
  }

  async onModuleDestroy() {
    // Закрываем подключения при завершении работы приложения
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
  }

  getClient(): Redis {
    return this.redisClient;
  }

  getSubscriber(): Redis {
    if (!this.redisSubscriber) {
      throw new Error('Redis subscriber not initialized');
    }
    return this.redisSubscriber;
  }

  // Методы для подписки с проверкой инициализации
  async subscribe(channel: string, callback: (message: any, channel: string) => void): Promise<void> {
    if (!this.redisSubscriber) {
      throw new Error('Redis subscriber not initialized');
    }

    await this.redisSubscriber.subscribe(channel);
    
    this.redisSubscriber.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage, channel);
        } catch (error) {
          callback(message, channel);
        }
      }
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.redisSubscriber.unsubscribe(channel);
  }

  // Методы для работы с пользовательскими сессиями
  async setUserSession(userId: string, data: any, ttl: number = 3600): Promise<string> {
    return this.set(`user_session:${userId}`, data, ttl);
  }

  async getUserSession(userId: string): Promise<any> {
    return this.get(`user_session:${userId}`);
  }

  async deleteUserSession(userId: string): Promise<number> {
    return this.delete(`user_session:${userId}`);
  }

  // Методы для работы с онлайн-статусами пользователей
  async setUserOnline(userId: string, socketId: string): Promise<void> {
    await this.redisClient.hset('online_users', userId, socketId);
    await this.publish('user_status', { userId, status: 'online' });
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.redisClient.hdel('online_users', userId);
    await this.publish('user_status', { userId, status: 'offline' });
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const result = await this.redisClient.hexists('online_users', userId);
    return result === 1;
  }

  async getOnlineUsers(): Promise<Record<string, string>> {
    return this.redisClient.hgetall('online_users');
  }

  // Методы для работы с рейт-лимитированием запросов
  async incrementRateLimit(key: string, ttl: number): Promise<number> {
    const count = await this.redisClient.incr(key);
    
    if (count === 1) {
      await this.redisClient.expire(key, ttl);
    }
    
    return count;
  }

  async getRateLimit(key: string): Promise<number> {
    const count = await this.redisClient.get(key);
    return count ? parseInt(count, 10) : 0;
  }
}