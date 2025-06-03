import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile, Coordinates } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GeolocationService } from '../common/services/geolocation.service';

export interface GeolocationSearchParams {
  coordinates: Coordinates;
  maxDistance?: number;
  minAge?: number;
  maxAge?: number;
  interestedIn?: string;
  excludeIds?: string[];
  limit?: number;
  offset?: number;
}

export interface ProfileWithDistance extends Profile {
  distance?: number;
  distanceFormatted?: string;
}

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private geolocationService: GeolocationService,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    // Проверяем, есть ли уже профиль у пользователя
    const existingProfile = await this.findByUserId(userId);
    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    // Валидируем координаты если они предоставлены
    if (createProfileDto.latitude && createProfileDto.longitude) {
      const coordinates = {
        latitude: createProfileDto.latitude,
        longitude: createProfileDto.longitude,
      };
      
      if (!this.geolocationService.validateCoordinates(coordinates)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
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

    // Валидируем новые координаты если они предоставлены
    if (updateProfileDto.latitude && updateProfileDto.longitude) {
      const coordinates = {
        latitude: updateProfileDto.latitude,
        longitude: updateProfileDto.longitude,
      };
      
      if (!this.geolocationService.validateCoordinates(coordinates)) {
        throw new BadRequestException('Invalid coordinates provided');
      }
    }

    await this.profilesRepository.update(profile.id, updateProfileDto);
    return this.findByUserId(userId);
  }

  async updateLocation(
    userId: string, 
    coordinates: Coordinates, 
    accuracy?: number
  ): Promise<Profile> {
    if (!this.geolocationService.validateCoordinates(coordinates)) {
      throw new BadRequestException('Invalid coordinates provided');
    }

    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Получаем информацию о городе (в будущем можно интегрировать с геокодированием)
    const locationInfo = await this.geolocationService.getCityByCoordinates(coordinates);

    await this.profilesRepository.update(profile.id, {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      locationUpdatedAt: new Date(),
      locationAccuracy: accuracy,
      city: locationInfo.city,
      country: locationInfo.country,
    });

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

  /**
   * Геолокационный поиск кандидатов
   */
  async findCandidatesByLocation(
    userId: string,
    searchParams: GeolocationSearchParams
  ): Promise<ProfileWithDistance[]> {
    const userProfile = await this.findByUserId(userId);
    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const {
      coordinates,
      maxDistance = userProfile.maxDistance || 50,
      minAge = 18,
      maxAge = 65,
      interestedIn,
      excludeIds = [],
      limit = 10,
      offset = 0,
    } = searchParams;

    // Создаем запрос с PostGIS
    const query = this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.userId != :userId', { userId })
      .andWhere('user.isActive = true')
      .andWhere('profile.isLocationVisible = true')
      .andWhere('profile.location IS NOT NULL')
      .andWhere('profile.age BETWEEN :minAge AND :maxAge', { minAge, maxAge });

    // Фильтр по полу
    const targetGender = interestedIn || userProfile.interestedIn;
    if (targetGender !== 'both') {
      query.andWhere('profile.gender = :targetGender', { targetGender });
    }

    // Исключаем уже просмотренных
    if (excludeIds.length > 0) {
      query.andWhere('profile.userId NOT IN (:...excludeIds)', { excludeIds });
    }

    // Добавляем геолокационный фильтр
    const distanceQuery = this.geolocationService.buildDistanceQuery(coordinates, maxDistance);
    query.andWhere(distanceQuery.where, distanceQuery.parameters);

    // Добавляем расстояние в SELECT
    const distanceSelect = this.geolocationService.buildDistanceSelectQuery(coordinates);
    query.addSelect(distanceSelect.select, 'distance');

    // Сортируем по расстоянию
    query.orderBy('distance', 'ASC');
    query.limit(limit).offset(offset);

    const results = await query.getRawAndEntities();

    // Обогащаем результаты информацией о расстоянии
    return results.entities.map((profile, index) => {
      const raw = results.raw[index];
      const distance = raw ? parseFloat(raw.distance) : null;
      
      return {
        ...profile,
        distance,
        distanceFormatted: distance ? this.geolocationService.formatDistance(distance) : null,
      } as ProfileWithDistance;
    });
  }

  /**
   * Обычный поиск кандидатов (без геолокации)
   */
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
      .andWhere('user.isActive = true');

    // Исключаем уже просмотренных пользователей
    if (excludeIds.length > 0) {
      query.andWhere('profile.userId NOT IN (:...excludeIds)', { excludeIds });
    }

    // Фильтр по полу и интересам
    if (userProfile.interestedIn !== 'both') {
      query.andWhere('profile.gender = :interestedIn', { 
        interestedIn: userProfile.interestedIn 
      });
    }

    // Фильтр по возрасту
    const minAge = 18;
    const maxAge = 65;
    query.andWhere('profile.age BETWEEN :minAge AND :maxAge', { minAge, maxAge });

    // Если у пользователя есть локация, сортируем по расстоянию
    if (userProfile.latitude && userProfile.longitude) {
      const coordinates = {
        latitude: userProfile.latitude,
        longitude: userProfile.longitude,
      };
      
      const distanceSelect = this.geolocationService.buildDistanceSelectQuery(coordinates);
      query.addSelect(distanceSelect.select, 'distance');
      query.andWhere('profile.latitude IS NOT NULL AND profile.longitude IS NOT NULL');
      query.orderBy('distance', 'ASC');
    } else {
      query.orderBy('profile.lastActive', 'DESC');
    }

    return query.limit(limit).getMany();
  }

  /**
   * Поиск профилей в определенном городе
   */
  async findProfilesByCity(city: string, limit: number = 20): Promise<Profile[]> {
    return this.profilesRepository.find({
      where: { 
        city: city,
        isLocationVisible: true,
      },
      relations: ['user'],
      take: limit,
      order: { lastActive: 'DESC' },
    });
  }

  /**
   * Получение статистики по местоположениям
   */
  async getLocationStats(): Promise<{
    totalWithLocation: number;
    topCities: Array<{ city: string; count: number }>;
    topCountries: Array<{ country: string; count: number }>;
  }> {
    const totalWithLocation = await this.profilesRepository.count({
      where: { location: 'IS NOT NULL' as any },
    });

    const topCities = await this.profilesRepository
      .createQueryBuilder('profile')
      .select('profile.city', 'city')
      .addSelect('COUNT(*)', 'count')
      .where('profile.city IS NOT NULL')
      .andWhere('profile.isLocationVisible = true')
      .groupBy('profile.city')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topCountries = await this.profilesRepository
      .createQueryBuilder('profile')
      .select('profile.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('profile.country IS NOT NULL')
      .andWhere('profile.isLocationVisible = true')
      .groupBy('profile.country')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalWithLocation,
      topCities: topCities.map(item => ({
        city: item.city,
        count: parseInt(item.count),
      })),
      topCountries: topCountries.map(item => ({
        country: item.country,
        count: parseInt(item.count),
      })),
    };
  }

  /**
   * Получение ID пользователей, которых уже просмотрели
   */
  private async getSwipedUserIds(userId: string): Promise<string[]> {
    // Этот метод будет вызывать SwipesService
    // Для простоты пока возвращаем пустой массив
    return [];
  }
}