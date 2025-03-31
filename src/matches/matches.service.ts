import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, LessThan } from 'typeorm';
import { Match, MatchStatus } from './entities/match.entity';
import { User } from '../users/entities/user.entity';
import { Profile, Gender, LookingFor } from '../users/entities/profile.entity';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchFilterDto } from './dto/match-filter.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createMatchDto: CreateMatchDto): Promise<Match> {
    const { targetUserId } = createMatchDto;
    
    // Проверяем, что пользователь не пытается создать мэтч сам с собой
    if (userId === targetUserId) {
      throw new BadRequestException('Невозможно создать мэтч с самим собой');
    }
    
    // Проверяем существование целевого пользователя
    const targetUser = await this.usersService.findById(targetUserId);
    
    // Проверяем, существует ли уже мэтч между этими пользователями
    const existingMatch = await this.matchesRepository.findOne({
      where: [
        { user1_id: userId, user2_id: targetUserId },
        { user1_id: targetUserId, user2_id: userId },
      ],
    });
    
    if (existingMatch) {
      // Если мэтч существует и другой пользователь лайкнул текущего пользователя
      if (existingMatch.user1_id === targetUserId && existingMatch.status === MatchStatus.PENDING) {
        // Обновляем статус до MATCHED
        existingMatch.status = MatchStatus.MATCHED;
        await this.matchesRepository.save(existingMatch);
        return existingMatch;
      }
      
      // Если мэтч существует, но был отклонен или заблокирован
      if (existingMatch.status === MatchStatus.REJECTED || existingMatch.status === MatchStatus.BLOCKED) {
        throw new BadRequestException('Мэтч с этим пользователем не может быть создан');
      }
      
      return existingMatch;
    }
    
    // Создаем новый мэтч
    const match = this.matchesRepository.create({
      user1_id: userId,
      user2_id: targetUserId,
      status: MatchStatus.PENDING,
    });
    
    await this.matchesRepository.save(match);
    return match;
  }

  async findAll(userId: string, filterDto: MatchFilterDto): Promise<Match[]> {
    const { status, unreadOnly } = filterDto;
    
    const query = this.matchesRepository.createQueryBuilder('match')
      .leftJoinAndSelect('match.user1', 'user1')
      .leftJoinAndSelect('match.user2', 'user2')
      .leftJoinAndSelect('user1.profile', 'profile1')
      .leftJoinAndSelect('user2.profile', 'profile2')
      .leftJoinAndSelect('user1.photos', 'photos1')
      .leftJoinAndSelect('user2.photos', 'photos2')
      .where('(match.user1_id = :userId OR match.user2_id = :userId)', { userId });
    
    // Фильтрация по статусу
    if (status && status.length > 0) {
      query.andWhere('match.status IN (:...status)', { status });
    } else {
      // По умолчанию показываем только активные мэтчи
      query.andWhere('match.status = :status', { status: MatchStatus.MATCHED });
    }
    
    // Фильтрация по непрочитанным сообщениям
    if (unreadOnly) {
      query.andWhere('(match.user1_id = :userId AND match.isRead1 = false) OR (match.user2_id = :userId AND match.isRead2 = false)', { userId });
    }
    
    // Сортировка по последнему сообщению
    query.orderBy('match.lastMessageAt', 'DESC');
    
    return query.getMany();
  }

  async findOne(userId: string, id: string): Promise<Match> {
    const match = await this.matchesRepository.findOne({
      where: [
        { id, user1_id: userId },
        { id, user2_id: userId },
      ],
      relations: ['user1', 'user2', 'user1.profile', 'user2.profile', 'user1.photos', 'user2.photos'],
    });
    
    if (!match) {
      throw new NotFoundException(`Мэтч с ID "${id}" не найден`);
    }
    
    return match;
  }

  async update(userId: string, id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    const match = await this.findOne(userId, id);
    
    // Обновляем поля мэтча
    Object.assign(match, updateMatchDto);
    
    await this.matchesRepository.save(match);
    return match;
  }

  async updateReadStatus(userId: string, id: string): Promise<Match> {
    const match = await this.findOne(userId, id);
    
    // Обновляем статус прочтения для соответствующего пользователя
    if (match.user1_id === userId) {
      match.isRead1 = true;
    } else if (match.user2_id === userId) {
      match.isRead2 = true;
    }
    
    await this.matchesRepository.save(match);
    return match;
  }

  async remove(userId: string, id: string): Promise<void> {
    const match = await this.findOne(userId, id);
    
    // Если пользователь - один из участников мэтча, обновляем статус на REJECTED
    match.status = MatchStatus.REJECTED;
    await this.matchesRepository.save(match);
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<User[]> {
    const user = await this.usersService.findById(userId);
    
    if (!user.profile) {
      throw new BadRequestException('Создайте профиль, чтобы получать рекомендации');
    }
    
    // Получаем базовые предпочтения пользователя
    const { gender, lookingFor, minAgePreference, maxAgePreference, maxDistance } = user.profile;
    
    // Расчет минимальной и максимальной даты рождения на основе предпочтений возраста
    const now = new Date();
    const minBirthDate = new Date(now.getFullYear() - maxAgePreference, now.getMonth(), now.getDate());
    const maxBirthDate = new Date(now.getFullYear() - minAgePreference, now.getMonth(), now.getDate());
    
    // Получаем ID уже просмотренных пользователей (мэтчи)
    const matches = await this.matchesRepository.find({
      where: [
        { user1_id: userId },
        { user2_id: userId },
      ],
    });
    
    const matchedUserIds = matches.map(match => 
      match.user1_id === userId ? match.user2_id : match.user1_id
    );
    
    // Добавляем ID текущего пользователя к исключениям
    matchedUserIds.push(userId);
    
    // Базовый запрос для получения рекомендаций
    const query = this.profilesRepository.createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('user.photos', 'photos')
      .where('user.id NOT IN (:...matchedUserIds)', { matchedUserIds })
      .andWhere('profile.birthDate BETWEEN :minBirthDate AND :maxBirthDate', { 
        minBirthDate, 
        maxBirthDate 
      });
    
    // Фильтр по полу в зависимости от предпочтений
    if (lookingFor === LookingFor.MEN) {
      query.andWhere('profile.gender = :gender', { gender: Gender.MALE });
    } else if (lookingFor === LookingFor.WOMEN) {
      query.andWhere('profile.gender = :gender', { gender: Gender.FEMALE });
    }
    
    // Если у пользователя есть геолокация, фильтруем по расстоянию
    if (user.profile.location) {
      query.andWhere(
        'ST_Distance(profile.location, ST_SetSRID(ST_Point(:longitude, :latitude), 4326)) <= :distance',
        {
          longitude: user.profile.location.coordinates[0],
          latitude: user.profile.location.coordinates[1],
          distance: maxDistance * 1000, // convert km to meters
        }
      );
    }
    
    // Сортировка по случайному порядку для разнообразия рекомендаций
    query.orderBy('RANDOM()');
    
    // Ограничение количества результатов
    query.limit(limit);
    
    const profiles = await query.getMany();
    
    // Извлекаем пользователей из профилей
    return profiles.map(profile => profile.user);
  }
}