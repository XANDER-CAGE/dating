import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private redisSubscriber: Redis;

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
    await this.redisClient.quit();
    await this.redisSubscriber.quit();
  }

  getClient(): Redis {
    return this.redisClient;
  }

  getSubscriber(): Redis {
    return this.redisSubscriber;
  }

  // Методы для работы с кешем
  async set(key: string, value: any, ttl?: number): Promise<string> {
    const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
    
    if (ttl) {
      return this.redisClient.set(key, serializedValue, 'EX', ttl);
    }
    
    return this.redisClient.set(key, serializedValue);
  }

  async get(key: string): Promise<any> {
    const value = await this.redisClient.get(key);
    
    if (!value) {
      return null;
    }
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }

  async delete(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) === 1;
  }

  // Методы для работы с pub/sub
  async publish(channel: string, message: any): Promise<number> {
    const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    return this.redisClient.publish(channel, serializedMessage);
  }

  async subscribe(channel: string, callback: (message: any, channel: string) => void): Promise<void> {
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