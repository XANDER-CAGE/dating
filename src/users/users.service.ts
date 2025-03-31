import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Interest } from './entities/interest.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto.ts';
import { instanceToPlain } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    
    @InjectRepository(Interest)
    private readonly interestsRepository: Repository<Interest>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, profile } = createUserDto;
    
    // Создаем нового пользователя
    const user = this.usersRepository.create({
      email,
      password,
    });
    
    // Сохраняем пользователя
    await this.usersRepository.save(user);
    
    // Если переданы данные профиля, создаем профиль
    if (profile) {
      const newProfile = this.profilesRepository.create({
        ...profile,
        user,
      });
      await this.profilesRepository.save(newProfile);
      
      // Обновляем пользователя с профилем
      user.profile = newProfile;
    }
    
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ['profile'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile', 'profile.interests', 'photos'],
    });
    
    if (!user) {
      throw new NotFoundException(`Пользователь с ID "${id}" не найден`);
    }
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['profile'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // Обновляем поля пользователя
    Object.assign(user, updateUserDto);
    
    // Сохраняем обновленного пользователя
    await this.usersRepository.save(user);
    
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Profile> {
    const user = await this.findById(userId);
    
    if (!user.profile) {
      // Если у пользователя нет профиля, создаем новый
      const newProfile = this.profilesRepository.create({
        ...updateProfileDto,
        user,
      });
      await this.profilesRepository.save(newProfile);
      
      // Обновляем пользователя с ссылкой на профиль
      user.profile = newProfile;
      await this.usersRepository.save(user);
      
      return newProfile;
    } else {
      // Если профиль уже существует, обновляем его
      Object.assign(user.profile, updateProfileDto);
      await this.profilesRepository.save(user.profile);
      return user.profile;
    }
  }
  
  async updateLastActive(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      lastActive: new Date(),
    });
  }
  
  async addInterestToProfile(userId: string, interestIds: string[]): Promise<Profile> {
    const user = await this.findById(userId);
    
    if (!user.profile) {
      throw new NotFoundException('Профиль пользователя не найден');
    }
    
    const interests = await this.interestsRepository.findByIds(interestIds);
    
    if (interests.length !== interestIds.length) {
      throw new BadRequestException('Некоторые указанные интересы не найдены');
    }
    
    // Добавляем новые интересы к существующим
    if (!user.profile.interests) {
      user.profile.interests = interests;
    } else {
      user.profile.interests = [...user.profile.interests, ...interests];
    }
    
    await this.profilesRepository.save(user.profile);
    return user.profile;
  }
  
  async removeInterestFromProfile(userId: string, interestId: string): Promise<Profile> {
    const user = await this.findById(userId);
    
    if (!user.profile || !user.profile.interests) {
      throw new NotFoundException('Профиль пользователя или интересы не найдены');
    }
    
    user.profile.interests = user.profile.interests.filter(
      interest => interest.id !== interestId
    );
    
    await this.profilesRepository.save(user.profile);
    return user.profile;
  }
  
  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user);
  }
  
  // Метод для удаления конфиденциальных данных перед отправкой клиенту
  sanitizeUser(user: User): any {
    return instanceToPlain(user);
  }
}