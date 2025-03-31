import {
    Controller,
    Get,
    Post,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
  import { GetUser } from '../decorators/user.decorator';
  import { NotificationsService } from '../services/notifications.service';
  
  @Controller('notifications')
  @UseGuards(JwtAuthGuard)
  export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}
  
    @Get()
    getNotifications(
      @GetUser('userId') userId: string,
      @Query('limit') limit: number = 20,
      @Query('offset') offset: number = 0,
    ) {
      return this.notificationsService.getNotifications(userId, limit, offset);
    }
  
    @Post(':id/read')
    markAsRead(
      @GetUser('userId') userId: string,
      @Param('id') notificationId: string,
    ) {
      return this.notificationsService.markNotificationAsRead(userId, notificationId);
    }
  
    @Post('read-all')
    markAllAsRead(@GetUser('userId') userId: string) {
      return this.notificationsService.markAllNotificationsAsRead(userId);
    }
  
    @Delete(':id')
    deleteNotification(
      @GetUser('userId') userId: string,
      @Param('id') notificationId: string,
    ) {
      return this.notificationsService.deleteNotification(userId, notificationId);
    }
  
    @Delete()
    clearAll(@GetUser('userId') userId: string) {
      return this.notificationsService.clearAllNotifications(userId);
    }
  }