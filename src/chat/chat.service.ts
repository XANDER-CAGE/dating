import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Match, MatchStatus } from '../matches/entities/match.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { PaginationDto } from './dto/chat-dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
  ) {}

  async createMessage(userId: string, createMessageDto: CreateMessageDto): Promise<Message> {
    const { matchId, text, type, mediaUrl } = createMessageDto;
    
    // Проверяем существование мэтча и права доступа
    const match = await this.matchesRepository.findOne({
      where: [
        { id: matchId, user1_id: userId },
        { id: matchId, user2_id: userId },
      ],
    });
    
    if (!match) {
      throw new NotFoundException(`Мэтч с ID "${matchId}" не найден`);
    }
    
    if (match.status !== MatchStatus.MATCHED) {
      throw new BadRequestException('Невозможно отправить сообщение в этот мэтч');
    }
    
    // Создаем новое сообщение
    const message = this.messagesRepository.create({
      match_id: matchId,
      sender_id: userId,
      text,
      type,
      mediaUrl,
    });
    
    // Обновляем время последнего сообщения и статус прочтения в мэтче
    if (match.user1_id === userId) {
      match.isRead1 = true;
      match.isRead2 = false;
    } else {
      match.isRead1 = false;
      match.isRead2 = true;
    }
    
    match.lastMessageAt = new Date();
    
    // Сохраняем изменения
    await this.matchesRepository.save(match);
    await this.messagesRepository.save(message);
    
    return message;
  }

  async getMessages(userId: string, matchId: string, paginationDto: PaginationDto): Promise<Message[]> {
    const { limit, offset } = paginationDto;
    
    // Проверяем существование мэтча и права доступа
    const match = await this.matchesRepository.findOne({
      where: [
        { id: matchId, user1_id: userId },
        { id: matchId, user2_id: userId },
      ],
    });
    
    if (!match) {
      throw new NotFoundException(`Мэтч с ID "${matchId}" не найден`);
    }
    
    // Получаем сообщения с пагинацией
    const messages = await this.messagesRepository.find({
      where: { match_id: matchId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['sender', 'sender.profile'],
    });
    
    // Обновляем статус прочтения сообщений
    if (messages.length > 0) {
      // Обновляем статус прочтения в мэтче
      if (match.user1_id === userId) {
        match.isRead1 = true;
      } else {
        match.isRead2 = true;
      }
      await this.matchesRepository.save(match);
      
      // Обновляем статус прочтения для сообщений от другого пользователя
      const unreadMessageIds = messages
        .filter(message => message.sender_id !== userId && !message.isRead)
        .map(message => message.id);
      
      if (unreadMessageIds.length > 0) {
        await this.messagesRepository.update(
          unreadMessageIds,
          { isRead: true }
        );
      }
    }
    
    // Возвращаем результаты в хронологическом порядке (от старых к новым)
    return messages.reverse();
  }

  async markAsRead(userId: string, messageId: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId },
      relations: ['match'],
    });
    
    if (!message) {
      throw new NotFoundException(`Сообщение с ID "${messageId}" не найдено`);
    }
    
    // Проверяем права доступа
    if (
      message.match.user1_id !== userId &&
      message.match.user2_id !== userId
    ) {
      throw new BadRequestException('Нет доступа к этому сообщению');
    }
    
    // Если сообщение от другого пользователя, отмечаем его как прочитанное
    if (message.sender_id !== userId) {
      message.isRead = true;
      await this.messagesRepository.save(message);
      
      // Обновляем статус прочтения в мэтче
      if (message.match.user1_id === userId) {
        message.match.isRead1 = true;
      } else {
        message.match.isRead2 = true;
      }
      await this.matchesRepository.save(message.match);
    }
    
    return message;
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId, sender_id: userId },
    });
    
    if (!message) {
      throw new NotFoundException(`Сообщение с ID "${messageId}" не найдено`);
    }
    
    // Проверяем, что сообщение принадлежит текущему пользователю
    if (message.sender_id !== userId) {
      throw new BadRequestException('Можно удалять только свои сообщения');
    }
    
    await this.messagesRepository.remove(message);
  }
}