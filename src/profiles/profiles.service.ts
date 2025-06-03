import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    // Проверяем, есть ли уже профиль у пользователя
    const existingProfile = await this.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    const profile = this.profilesRepository.create({
      ...createProfileDto,
      userId,
    });

    return this.profilesRepository.save(profile);
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    return this.profilesRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async findById(id: string): Promise<Profile | null> {
    return this.profilesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async update(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    await this.profilesRepository.update(profile.id, updateProfileDto);
    return this.findByUserId(userId);
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.profilesRepository.update(
      { userId },
      { lastActive: new Date() }
    );
  }

  async addPhoto(userId: string, photoUrl: string): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const currentPhotos = profile.photos || [];
    if (currentPhotos.length >= 6) {
      throw new ConflictException('Maximum 6 photos allowed');
    }

    const updatedPhotos = [...currentPhotos, photoUrl];
    await this.profilesRepository.update(profile.id, { photos: updatedPhotos });
    
    return this.findByUserId(userId);
  }

  async removePhoto(userId: string, photoUrl: string): Promise<Profile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const currentPhotos = profile.photos || [];
    const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
    
    await this.profilesRepository.update(profile.id, { photos: updatedPhotos });
    
    return this.findByUserId(userId);
  }

  async delete(userId: string): Promise<boolean> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      return false;
    }

    const result = await this.profilesRepository.delete(profile.id);
    return result.affected > 0;
  }

  // Метод для получения потенциальных кандидатов (для будущего матчинга)
  async findCandidates(
    userId: string,
    limit: number = 10,
    excludeIds: string[] = []
  ): Promise<Profile[]> {
    const userProfile = await this.findByUserId(userId);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const query = this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.userId != :userId', { userId })
      .andWhere('user.isActive = true')
      .andWhere('profile.gender = :interestedIn', { 
        interestedIn: userProfile.interestedIn 
      });

    if (excludeIds.length > 0) {
      query.andWhere('profile.userId NOT IN (:...excludeIds)', { excludeIds });
    }

    // Если у пользователя указана геолокация, сортируем по расстоянию
    if (userProfile.latitude && userProfile.longitude) {
      query
        .addSelect(
          `ST_Distance(
            ST_Point(:userLng, :userLat)::geography,
            ST_Point(profile.longitude, profile.latitude)::geography
          ) / 1000 as distance`
        )
        .andWhere('profile.latitude IS NOT NULL')
        .andWhere('profile.longitude IS NOT NULL')
        .setParameters({
          userLat: userProfile.latitude,
          userLng: userProfile.longitude,
        })
        .orderBy('distance', 'ASC');
    } else {
      query.orderBy('profile.lastActive', 'DESC');
    }

    return query.limit(limit).getMany();
  }

  async findCandidatesExcludingSwipes(
    userId: string,
    limit: number = 10
  ): Promise<Profile[]> {
    const userProfile = await this.findByUserId(userId);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    // Получаем ID всех пользователей, на которых уже сделали свайп
    const swipedUserIds = await this.getSwipedUserIds(userId);
    
    const query = this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.userId != :userId', { userId })
      .andWhere('user.isActive = true');

    // Исключаем уже просмотренных пользователей
    if (swipedUserIds.length > 0) {
      query.andWhere('profile.userId NOT IN (:...swipedUserIds)', { swipedUserIds });
    }

    // Фильтр по полу и интересам
    if (userProfile.interestedIn !== 'both') {
      query.andWhere('profile.gender = :interestedIn', { 
        interestedIn: userProfile.interestedIn 
      });
    }

    // Фильтр по возрасту (можно добавить настройки в профиль)
    const minAge = 18;
    const maxAge = 65;
    query.andWhere('profile.age BETWEEN :minAge AND :maxAge', { minAge, maxAge });

    // Геолокация и расстояние
    if (userProfile.latitude && userProfile.longitude) {
      query
        .addSelect(
          `ST_Distance(
            ST_Point(:userLng, :userLat)::geography,
            ST_Point(profile.longitude, profile.latitude)::geography
          ) / 1000 as distance`
        )
        .andWhere('profile.latitude IS NOT NULL')
        .andWhere('profile.longitude IS NOT NULL')
        .andWhere(
          `ST_Distance(
            ST_Point(:userLng, :userLat)::geography,
            ST_Point(profile.longitude, profile.latitude)::geography
          ) / 1000 <= :maxDistance`
        )
        .setParameters({
          userLat: userProfile.latitude,
          userLng: userProfile.longitude,
          maxDistance: userProfile.maxDistance,
        })
        .orderBy('distance', 'ASC');
    } else {
      query.orderBy('profile.lastActive', 'DESC');
    }

    return query.limit(limit).getMany();
  }

  private async getSwipedUserIds(userId: string): Promise<string[]> {
    // Этот метод будет вызывать SwipesService
    // Для простоты пока возвращаем пустой массив
    return [];
  }
}