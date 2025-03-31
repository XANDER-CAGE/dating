import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from './redis.service';
import { User } from '../../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

export enum NotificationType {
  MATCH = 'match',
  MESSAGE = 'message',
  LIKE = 'like',
  SYSTEM = 'system',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Подписываемся на события из Redis
    this.subscribeToEvents();
  }

  private async subscribeToEvents() {
    // Подписываемся на события мэтчей
    await this.redisService.subscribe('new_match', (data) => {
      this.sendNotification(
        data.userId,
        NotificationType.MATCH,
        'Новый мэтч!',
        'У вас появился новый мэтч. Начните общение прямо сейчас!',
        { matchId: data.matchId }
      );
    });

    // Подписываемся на события сообщений
    await this.redisService.subscribe('new_message', (data) => {
      this.sendNotification(
        data.userId,
        NotificationType.MESSAGE,
        'Новое сообщение',
        data.preview || 'Вам пришло новое сообщение',
        { matchId: data.matchId, messageId: data.messageId }
      );
    });

    // Подписываемся на события лайков
    await this.redisService.subscribe('new_like', (data) => {
      this.sendNotification(
        data.userId,
        NotificationType.LIKE,
        'Новый лайк',
        'Кому-то понравился ваш профиль!',
        { matchId: data.matchId }
      );
    });
  }

  async sendNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: any,
  ): Promise<Notification> {
    const notification: Notification = {
      id: uuidv4(),
      userId,
      type,
      title,
      body,
      data,
      isRead: false,
      createdAt: new Date(),
    };

    // Сохраняем уведомление в Redis
    await this.saveNotification(notification);

    // Получаем информацию о пользователе
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // Отправляем пуш-уведомление, если пользователь не в сети и у него есть push token
    const isUserOnline = await this.redisService.isUserOnline(userId);
    if (!isUserOnline && user.pushToken) {
      await this.sendPushNotification(user.pushToken, notification);
    }

    // Публикуем уведомление в Redis для мгновенной доставки через WebSocket
    await this.redisService.publish(`notification:${userId}`, notification);

    return notification;
  }

  private async saveNotification(notification: Notification): Promise<void> {
    const key = `notifications:${notification.userId}`;
    
    // Получаем текущие уведомления
    const notifications = await this.redisService.get(key) || [];
    
    // Добавляем новое уведомление в начало списка
    notifications.unshift(notification);
    
    // Ограничиваем количество сохраняемых уведомлений (например, последние 100)
    const limit = this.configService.get('NOTIFICATIONS_LIMIT', 100);
    const limitedNotifications = notifications.slice(0, limit);
    
    // Сохраняем обновленный список
    await this.redisService.set(key, limitedNotifications);
  }

  private async sendPushNotification(pushToken: string, notification: Notification): Promise<void> {
    try {
      // Здесь должен быть код для отправки пуш-уведомления через выбранного провайдера,
      // например Firebase Cloud Messaging или другой сервис
      
      // Пример для Firebase (псевдокод):
      /*
      const message = {
        token: pushToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
      };
      
      await firebase.messaging().send(message);
      */
      
      console.log(`Push notification sent to user ${notification.userId}`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const key = `notifications:${userId}`;
    
    // Получаем все уведомления пользователя
    const notifications = await this.redisService.get(key) || [];
    
    // Применяем пагинацию
    return notifications.slice(offset, offset + limit);
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    const key = `notifications:${userId}`;
    
    // Получаем все уведомления пользователя
    const notifications = await this.redisService.get(key) || [];
    
    // Находим и обновляем нужное уведомление
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    
    if (notificationIndex === -1) {
      return false;
    }
    
    notifications[notificationIndex].isRead = true;
    
    // Сохраняем обновленный список
    await this.redisService.set(key, notifications);
    
    return true;
  }

  async markAllNotificationsAsRead(userId: string): Promise<boolean> {
    const key = `notifications:${userId}`;
    
    // Получаем все уведомления пользователя
    const notifications = await this.redisService.get(key) || [];
    
    // Отмечаем все как прочитанные
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    
    // Сохраняем обновленный список
    await this.redisService.set(key, updatedNotifications);
    
    return true;
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const key = `notifications:${userId}`;
    
    // Получаем все уведомления пользователя
    const notifications = await this.redisService.get(key) || [];
    
    // Фильтруем список, удаляя нужное уведомление
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    
    if (updatedNotifications.length === notifications.length) {
      return false;
    }
    
    // Сохраняем обновленный список
    await this.redisService.set(key, updatedNotifications);
    
    return true;
  }

  async clearAllNotifications(userId: string): Promise<boolean> {
    const key = `notifications:${userId}`;
    
    // Устанавливаем пустой список уведомлений
    await this.redisService.set(key, []);
    
    return true;
  }
}