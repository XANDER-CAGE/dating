import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Swipe, SwipeAction } from './entities/swipe.entity';
import { Match } from '../matches/entities/match.entity';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SwipesService {
  constructor(
    @InjectRepository(Swipe)
    private swipesRepository: Repository<Swipe>,
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private profilesService: ProfilesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createSwipe(
    swiperId: string,
    createSwipeDto: CreateSwipeDto
  ): Promise<{ swipe: Swipe; isMatch: boolean; matchId?: string }> {
    const { swipedId, action } = createSwipeDto;

    // Проверяем, что пользователь не свайпает сам себя
    if (swiperId === swipedId) {
      throw new BadRequestException('Cannot swipe on yourself');
    }

    // Проверяем, существует ли профиль того, кого свайпают
    const targetProfile = await this.profilesService.findByUserId(swipedId);
    if (!targetProfile) {
      throw new NotFoundException('Target user profile not found');
    }

    // Проверяем, не делал ли пользователь уже свайп на этого человека
    const existingSwipe = await this.swipesRepository.findOne({
      where: { swiperId, swipedId },
    });

    if (existingSwipe) {
      throw new BadRequestException('You have already swiped on this user');
    }

    // Создаем свайп
    const swipe = this.swipesRepository.create({
      swiperId,
      swipedId,
      action,
    });

    const savedSwipe = await this.swipesRepository.save(swipe);

    // Если это лайк или супер-лайк, проверяем на матч
    let isMatch = false;
    let matchId: string | undefined;

    if (action === SwipeAction.LIKE || action === SwipeAction.SUPER_LIKE) {
      const reverseSwipe = await this.swipesRepository.findOne({
        where: {
          swiperId: swipedId,
          swipedId: swiperId,
          action: In([SwipeAction.LIKE, SwipeAction.SUPER_LIKE]),
        },
      });

      if (reverseSwipe) {
        // Создаем матч
        const match = await this.createMatch(swiperId, swipedId);
        isMatch = true;
        matchId = match.id;

        // Отправляем событие о новом матче
        this.eventEmitter.emit('match.created', {
          matchId: match.id,
          user1Id: swiperId,
          user2Id: swipedId,
        });
      }
    }

    // Отправляем событие о свайпе
    this.eventEmitter.emit('swipe.created', {
      swipeId: savedSwipe.id,
      swiperId,
      swipedId,
      action,
      isMatch,
    });

    return { swipe: savedSwipe, isMatch, matchId };
  }

  private async createMatch(user1Id: string, user2Id: string): Promise<Match> {
    // Упорядочиваем ID пользователей для консистентности
    const [sortedUser1Id, sortedUser2Id] = [user1Id, user2Id].sort();

    // Проверяем, не существует ли уже матч
    const existingMatch = await this.matchesRepository.findOne({
      where: { user1Id: sortedUser1Id, user2Id: sortedUser2Id },
    });

    if (existingMatch) {
      return existingMatch;
    }

    const match = this.matchesRepository.create({
      user1Id: sortedUser1Id,
      user2Id: sortedUser2Id,
    });

    return this.matchesRepository.save(match);
  }

  async getSwipeHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Swipe[]> {
    return this.swipesRepository.find({
      where: { swiperId: userId },
      relations: ['swiped', 'swiped.profile'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getSwipedUserIds(userId: string): Promise<string[]> {
    const swipes = await this.swipesRepository.find({
      where: { swiperId: userId },
      select: ['swipedId'],
    });

    return swipes.map(swipe => swipe.swipedId);
  }

  async undoLastSwipe(userId: string): Promise<boolean> {
    const lastSwipe = await this.swipesRepository.findOne({
      where: { swiperId: userId },
      order: { createdAt: 'DESC' },
    });

    if (!lastSwipe) {
      throw new NotFoundException('No swipes to undo');
    }

    // Проверяем, не прошло ли слишком много времени (например, 5 минут)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (lastSwipe.createdAt < fiveMinutesAgo) {
      throw new BadRequestException('Cannot undo swipe older than 5 minutes');
    }

    // Если был создан матч из-за этого свайпа, удаляем его
    if (lastSwipe.action === SwipeAction.LIKE || lastSwipe.action === SwipeAction.SUPER_LIKE) {
      const match = await this.matchesRepository.findOne({
        where: [
          { user1Id: userId, user2Id: lastSwipe.swipedId },
          { user1Id: lastSwipe.swipedId, user2Id: userId },
        ],
      });

      if (match && match.createdAt > lastSwipe.createdAt) {
        await this.matchesRepository.remove(match);
      }
    }

    await this.swipesRepository.remove(lastSwipe);
    return true;
  }
}