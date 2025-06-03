import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Or } from 'typeorm';
import { Match } from './entities/match.entity';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
  ) {}

  async getUserMatches(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Match[]> {
    return this.matchesRepository.find({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
      relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
      order: { lastMessageAt: 'DESC', createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    return this.matchesRepository.findOne({
      where: { id: matchId, isActive: true },
      relations: ['user1', 'user1.profile', 'user2', 'user2.profile'],
    });
  }

  async unmatch(matchId: string, userId: string): Promise<boolean> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new NotFoundException('Match not found');
    }

    // Проверяем, что пользователь является участником матча
    if (match.user1Id !== userId && match.user2Id !== userId) {
      throw new NotFoundException('Match not found');
    }

    await this.matchesRepository.update(matchId, { isActive: false });
    return true;
  }

  async updateLastMessageTime(matchId: string): Promise<void> {
    await this.matchesRepository.update(matchId, {
      lastMessageAt: new Date(),
    });
  }

  async getMatchesCount(userId: string): Promise<number> {
    return this.matchesRepository.count({
      where: [
        { user1Id: userId, isActive: true },
        { user2Id: userId, isActive: true },
      ],
    });
  }
}