import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageType } from './entities/message.entity';
import { Match } from '../matches/entities/match.entity';
import { SendMessageDto } from './dto/send-message.dto';
import { MatchesService } from '../matches/matches.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatsService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private matchesService: MatchesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async sendMessage(
    matchId: string,
    senderId: string,
    sendMessageDto: SendMessageDto
  ): Promise<Message> {
    // Проверяем, что матч существует и пользователь является его участником
    const match = await this.matchesService.getMatchById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.user1Id !== senderId && match.user2Id !== senderId) {
      throw new ForbiddenException('You are not a participant of this match');
    }

    // Создаем сообщение
    const message = this.messagesRepository.create({
      matchId,
      senderId,
      content: sendMessageDto.content,
      messageType: sendMessageDto.messageType || MessageType.TEXT,
    });

    const savedMessage = await this.messagesRepository.save(message);

    // Обновляем время последнего сообщения в матче
    await this.matchesService.updateLastMessageTime(matchId);

    // Загружаем полную информацию о сообщении для ответа
    const fullMessage = await this.messagesRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'sender.profile'],
    });

    // Отправляем real-time событие
    const recipientId = match.user1Id === senderId ? match.user2Id : match.user1Id;
    
    this.eventEmitter.emit('message.sent', {
      messageId: fullMessage.id,
      matchId,
      senderId,
      recipientId,
      content: sendMessageDto.content,
      messageType: sendMessageDto.messageType || MessageType.TEXT,
      createdAt: fullMessage.createdAt,
    });

    return fullMessage;
  }

  async getMessages(
    matchId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    // Проверяем, что пользователь является участником матча
    const match = await this.matchesService.getMatchById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }

    return this.messagesRepository.find({
      where: { matchId },
      relations: ['sender', 'sender.profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async markMessagesAsRead(matchId: string, userId: string): Promise<number> {
    // Проверяем, что пользователь является участником матча
    const match = await this.matchesService.getMatchById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new ForbiddenException('You are not a participant of this match');
    }

    // Отмечаем как прочитанные все сообщения в матче, которые не от текущего пользователя
    const result = await this.messagesRepository.update(
      {
        matchId,
        senderId: match.user1Id === userId ? match.user2Id : match.user1Id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Отправляем событие о прочтении сообщений
    if (result.affected > 0) {
      const recipientId = match.user1Id === userId ? match.user2Id : match.user1Id;
      this.eventEmitter.emit('messages.read', {
        matchId,
        readerId: userId,
        recipientId,
        readCount: result.affected,
      });
    }

    return result.affected;
  }

  async getUserChats(userId: string): Promise<any[]> {
    // Получаем все матчи пользователя
    const matches = await this.matchesService.getUserMatches(userId, 100, 0);

    const chats = await Promise.all(
      matches.map(async (match) => {
        // Определяем партнера
        const partner = match.user1Id === userId ? match.user2 : match.user1;
        
        // Получаем последнее сообщение
        const lastMessage = await this.messagesRepository.findOne({
          where: { matchId: match.id },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        // Считаем непрочитанные сообщения
        const unreadCount = await this.messagesRepository.count({
          where: {
            matchId: match.id,
            senderId: partner.id,
            isRead: false,
          },
        });

        return {
          matchId: match.id,
          partnerId: partner.id,
          partnerName: partner.profile?.name || 'Unknown',
          partnerPhotos: partner.profile?.photos || [],
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.isRead,
          } : null,
          unreadCount,
          matchedAt: match.createdAt,
        };
      })
    );

    // Сортируем по времени последнего сообщения
    return chats.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt || a.matchedAt;
      const timeB = b.lastMessage?.createdAt || b.matchedAt;
      return new Date(timeB).getTime() - new Date(timeA).getTime();
    });
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['match'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Проверяем, что пользователь является отправителем сообщения
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    // Проверяем, что сообщение не старше 24 часов
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (message.createdAt < oneDayAgo) {
      throw new ForbiddenException('Cannot delete messages older than 24 hours');
    }

    await this.messagesRepository.remove(message);

    // Отправляем событие об удалении сообщения
    this.eventEmitter.emit('message.deleted', {
      messageId,
      matchId: message.matchId,
      deletedBy: userId,
    });

    return true;
  }

  async editMessage(
    messageId: string,
    userId: string,
    newContent: string
  ): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'sender.profile'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    // Проверяем, что сообщение не старше 24 часов
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (message.createdAt < oneDayAgo) {
      throw new ForbiddenException('Cannot edit messages older than 24 hours');
    }

    await this.messagesRepository.update(messageId, {
      content: newContent,
      isEdited: true,
      editedAt: new Date(),
    });

    const updatedMessage = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['sender', 'sender.profile'],
    });

    // Отправляем событие о редактировании сообщения
    this.eventEmitter.emit('message.edited', {
      messageId,
      matchId: message.matchId,
      newContent,
      editedBy: userId,
    });

    return updatedMessage;
  }
}