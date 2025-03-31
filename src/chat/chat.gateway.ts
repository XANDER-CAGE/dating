import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WsResponse,
    ConnectedSocket,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { Logger, UseGuards } from '@nestjs/common';
  import { ChatService } from './chat.service';
  import { CreateMessageDto } from './dto/create-message.dto';
  import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
  import { WsUser } from '../common/decorators/ws-user.decorator';
  
  @WebSocketGateway({
    cors: {
      origin: '*',
    },
    namespace: 'chat',
  })
  export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChatGateway.name);
    private readonly connectedUsers = new Map<string, string>(); // userId -> socketId
  
    @WebSocketServer()
    server: Server;
  
    constructor(private readonly chatService: ChatService) {}
  
    afterInit() {
      this.logger.log('WebSocket Gateway initialized');
    }
  
    handleConnection(client: Socket) {
      this.logger.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      this.logger.log(`Client disconnected: ${client.id}`);
      
      // Удаляем информацию о подключенном пользователе
      for (const [userId, socketId] of this.connectedUsers.entries()) {
        if (socketId === client.id) {
          this.connectedUsers.delete(userId);
          break;
        }
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('authenticate')
    handleAuthenticate(
      @ConnectedSocket() client: Socket,
      @WsUser('userId') userId: string,
    ) {
      this.logger.log(`User authenticated: ${userId}`);
      
      // Сохраняем информацию о подключенном пользователе
      this.connectedUsers.set(userId, client.id);
      
      // Подписываем пользователя на его личный канал
      client.join(`user_${userId}`);
      
      return { event: 'authenticated', data: { success: true } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('join_match')
    handleJoinMatch(
      @ConnectedSocket() client: Socket,
      @WsUser('userId') userId: string,
      @MessageBody() data: { matchId: string },
    ) {
      this.logger.log(`User ${userId} joined match: ${data.matchId}`);
      
      // Подписываем пользователя на канал мэтча
      client.join(`match_${data.matchId}`);
      
      return { event: 'joined_match', data: { matchId: data.matchId } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('leave_match')
    handleLeaveMatch(
      @ConnectedSocket() client: Socket,
      @WsUser('userId') userId: string,
      @MessageBody() data: { matchId: string },
    ) {
      this.logger.log(`User ${userId} left match: ${data.matchId}`);
      
      // Отписываем пользователя от канала мэтча
      client.leave(`match_${data.matchId}`);
      
      return { event: 'left_match', data: { matchId: data.matchId } };
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('send_message')
    async handleSendMessage(
      @ConnectedSocket() client: Socket,
      @WsUser('userId') userId: string,
      @MessageBody() createMessageDto: CreateMessageDto,
    ) {
      this.logger.log(`User ${userId} sent message to match: ${createMessageDto.matchId}`);
      
      try {
        // Создаем сообщение через сервис
        const message = await this.chatService.createMessage(userId, createMessageDto);
        
        // Отправляем сообщение всем участникам мэтча
        this.server.to(`match_${createMessageDto.matchId}`).emit('new_message', message);
        
        // Если получатель не подключен к каналу мэтча, но онлайн, отправляем уведомление
        const match = message.match;
        const recipientId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const recipientSocketId = this.connectedUsers.get(recipientId);
        
        if (recipientSocketId && !client.rooms.has(`match_${createMessageDto.matchId}`)) {
          this.server.to(`user_${recipientId}`).emit('new_message_notification', {
            matchId: createMessageDto.matchId,
            message,
          });
        }
        
        return { event: 'message_sent', data: message };
      } catch (error) {
        return { event: 'message_error', data: { error: error.message } };
      }
    }
  
    @UseGuards(WsJwtGuard)
    @SubscribeMessage('typing')
    handleTyping(
      @WsUser('userId') userId: string,
      @MessageBody() data: { matchId: string, isTyping: boolean },
    ) {
      // Отправляем информацию о печатании всем участникам мэтча
      this.server.to(`match_${data.matchId}`).emit('user_typing', {
        userId,
        matchId: data.matchId,
        isTyping: data.isTyping,
      });
      
      return { event: 'typing_sent', data: { success: true } };
    }
  
    // Метод для отправки оповещений о новых мэтчах
    async sendMatchNotification(matchId: string, user1Id: string, user2Id: string) {
      // Отправляем уведомление обоим пользователям
      this.server.to(`user_${user1Id}`).emit('new_match', { matchId });
      this.server.to(`user_${user2Id}`).emit('new_match', { matchId });
    }
  }