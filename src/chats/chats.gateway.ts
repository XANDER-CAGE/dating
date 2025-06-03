import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UseGuards, Logger } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { OnEvent } from '@nestjs/event-emitter';
  
  interface AuthenticatedSocket extends Socket {
    userId?: string;
  }
  
  @WebSocketGateway({
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
    namespace: '/chat',
  })
  export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private readonly logger = new Logger(ChatsGateway.name);
    private userSockets = new Map<string, string>(); // userId -> socketId
  
    constructor(
      private jwtService: JwtService,
      private configService: ConfigService,
    ) {}
  
    async handleConnection(client: AuthenticatedSocket) {
      try {
        const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          client.disconnect();
          return;
        }
  
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
  
        client.userId = payload.sub;
        this.userSockets.set(payload.sub, client.id);
        
        // Присоединяем к комнате пользователя
        client.join(`user_${payload.sub}`);
        
        this.logger.log(`User ${payload.sub} connected with socket ${client.id}`);
      } catch (error) {
        this.logger.error('WebSocket authentication failed:', error);
        client.disconnect();
      }
    }
  
    handleDisconnect(client: AuthenticatedSocket) {
      if (client.userId) {
        this.userSockets.delete(client.userId);
        this.logger.log(`User ${client.userId} disconnected`);
      }
    }
  
    @SubscribeMessage('join_match')
    handleJoinMatch(
      @ConnectedSocket() client: AuthenticatedSocket,
      @MessageBody() data: { matchId: string }
    ) {
      if (client.userId) {
        client.join(`match_${data.matchId}`);
        this.logger.log(`User ${client.userId} joined match ${data.matchId}`);
      }
    }
  
    @SubscribeMessage('leave_match')
    handleLeaveMatch(
      @ConnectedSocket() client: AuthenticatedSocket,
      @MessageBody() data: { matchId: string }
    ) {
      if (client.userId) {
        client.leave(`match_${data.matchId}`);
        this.logger.log(`User ${client.userId} left match ${data.matchId}`);
      }
    }
  
    @SubscribeMessage('typing_start')
    handleTypingStart(
      @ConnectedSocket() client: AuthenticatedSocket,
      @MessageBody() data: { matchId: string }
    ) {
      if (client.userId) {
        client.to(`match_${data.matchId}`).emit('user_typing', {
          userId: client.userId,
          matchId: data.matchId,
          isTyping: true,
        });
      }
    }
  
    @SubscribeMessage('typing_stop')
    handleTypingStop(
      @ConnectedSocket() client: AuthenticatedSocket,
      @MessageBody() data: { matchId: string }
    ) {
      if (client.userId) {
        client.to(`match_${data.matchId}`).emit('user_typing', {
          userId: client.userId,
          matchId: data.matchId,
          isTyping: false,
        });
      }
    }
  
    // Event listeners для системных событий
    @OnEvent('message.sent')
    handleMessageSent(payload: any) {
      // Отправляем сообщение в комнату матча
      this.server.to(`match_${payload.matchId}`).emit('new_message', {
        messageId: payload.messageId,
        matchId: payload.matchId,
        senderId: payload.senderId,
        content: payload.content,
        messageType: payload.messageType,
        createdAt: payload.createdAt,
      });
  
      // Отправляем уведомление получателю
      this.server.to(`user_${payload.recipientId}`).emit('message_notification', {
        matchId: payload.matchId,
        senderId: payload.senderId,
        content: payload.content,
      });
    }
  
    @OnEvent('messages.read')
    handleMessagesRead(payload: any) {
      this.server.to(`match_${payload.matchId}`).emit('messages_read', {
        matchId: payload.matchId,
        readerId: payload.readerId,
        readCount: payload.readCount,
      });
    }
  
    @OnEvent('message.deleted')
    handleMessageDeleted(payload: any) {
      this.server.to(`match_${payload.matchId}`).emit('message_deleted', {
        messageId: payload.messageId,
        matchId: payload.matchId,
      });
    }
  
    @OnEvent('message.edited')
    handleMessageEdited(payload: any) {
      this.server.to(`match_${payload.matchId}`).emit('message_edited', {
        messageId: payload.messageId,
        matchId: payload.matchId,
        newContent: payload.newContent,
      });
    }
  
    @OnEvent('match.created')
    handleMatchCreated(payload: any) {
      // Уведомляем обоих пользователей о новом матче
      this.server.to(`user_${payload.user1Id}`).emit('new_match', {
        matchId: payload.matchId,
        partnerId: payload.user2Id,
      });
      
      this.server.to(`user_${payload.user2Id}`).emit('new_match', {
        matchId: payload.matchId,
        partnerId: payload.user1Id,
      });
    }
  }