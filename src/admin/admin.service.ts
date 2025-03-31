import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Photo } from '../media/entities/photo.entity';
import { Match } from '../matches/entities/match.entity';
import { Message } from '../chat/entities/message.entity';
import { AuditLog, AuditLogAction } from './entities/audit-log.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ModeratePhotoDto } from './dto/moderate-photo.dto';
import { UserRole } from '../auth/guards/roles.guard';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    
    @InjectRepository(Photo)
    private readonly photosRepository: Repository<Photo>,
    
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    
    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,
    
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: UserRole,
    isActive?: boolean,
    isBanned?: boolean,
  ) {
    const skip = (page - 1) * limit;
    
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .take(limit)
      .skip(skip);
    
    if (search) {
      query.andWhere(
        '(user.email ILIKE :search OR profile.name ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    
    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }
    
    if (isBanned !== undefined) {
      query.andWhere('user.isBanned = :isBanned', { isBanned });
    }
    
    const [users, total] = await query.getManyAndCount();
    
    return {
      users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['profile', 'photos'],
    });
    
    if (!user) {
      throw new NotFoundException(`Пользователь с ID "${id}" не найден`);
    }
    
    return user;
  }

  async banUser(userId: string, banUserDto: BanUserDto, adminId: string) {
    const user = await this.getUserById(userId);
    
    // Не позволяем банить администраторов
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Нельзя заблокировать администратора');
    }
    
    // Предыдущее состояние пользователя для аудита
    const beforeState = { isBanned: user.isBanned, banReason: user.banReason };
    
    // Обновляем статус бана
    user.isBanned = true;
    user.banReason = banUserDto.reason;
    
    await this.usersRepository.save(user);
    
    // Создаем запись в журнале аудита
    await this.createAuditLog(
      AuditLogAction.USER_BANNED,
      userId,
      adminId,
      {
        reason: banUserDto.reason,
        notes: banUserDto.notes,
      },
      beforeState,
      { isBanned: true, banReason: banUserDto.reason }
    );
    
    return user;
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await this.getUserById(userId);
    
    if (!user.isBanned) {
      throw new BadRequestException('Пользователь не заблокирован');
    }
    
    // Предыдущее состояние пользователя для аудита
    const beforeState = { isBanned: user.isBanned, banReason: user.banReason };
    
    // Обновляем статус бана
    user.isBanned = false;
    user.banReason = null;
    
    await this.usersRepository.save(user);
    
    // Создаем запись в журнале аудита
    await this.createAuditLog(
      AuditLogAction.USER_UNBANNED,
      userId,
      adminId,
      {},
      beforeState,
      { isBanned: false, banReason: null }
    );
    
    return user;
  }

  async updateUserRole(userId: string, role: UserRole, adminId: string) {
    const user = await this.getUserById(userId);
    
    // Предыдущее состояние пользователя для аудита
    const beforeState = { role: user.role };
    
    // Обновляем роль пользователя
    user.role = role;
    
    await this.usersRepository.save(user);
    
    // Создаем запись в журнале аудита
    await this.createAuditLog(
      AuditLogAction.ROLE_UPDATED,
      userId,
      adminId,
      { newRole: role },
      beforeState,
      { role }
    );
    
    return user;
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await this.getUserById(userId);
    
    // Не позволяем удалять администраторов
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Нельзя удалить администратора');
    }
    
    // Создаем запись в журнале аудита перед удалением
    await this.createAuditLog(
      AuditLogAction.USER_DELETED,
      userId,
      adminId,
      {},
      { user },
      null
    );
    
    await this.usersRepository.remove(user);
    
    return { success: true };
  }

  async getUnmoderatedPhotos(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    
    const [photos, total] = await this.photosRepository.findAndCount({
      where: { isModerated: false },
      relations: ['user', 'user.profile'],
      skip,
      take: limit,
    });
    
    return {
      photos,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async moderatePhoto(photoId: string, moderatePhotoDto: ModeratePhotoDto, adminId: string) {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId },
      relations: ['user'],
    });
    
    if (!photo) {
      throw new NotFoundException(`Фото с ID "${photoId}" не найдено`);
    }
    
    // Предыдущее состояние фото для аудита
    const beforeState = {
      isModerated: photo.isModerated,
      isApproved: photo.isApproved,
      rejectionReason: photo.rejectionReason,
    };
    
    // Обновляем статус модерации
    photo.isModerated = true;
    photo.isApproved = moderatePhotoDto.isApproved;
    photo.rejectionReason = moderatePhotoDto.rejectionReason;
    
    await this.photosRepository.save(photo);
    
    // Создаем запись в журнале аудита
    await this.createAuditLog(
      AuditLogAction.PHOTO_MODERATED,
      photo.userId,
      adminId,
      {
        photoId,
        isApproved: moderatePhotoDto.isApproved,
        rejectionReason: moderatePhotoDto.rejectionReason,
      },
      beforeState,
      {
        isModerated: true,
        isApproved: moderatePhotoDto.isApproved,
        rejectionReason: moderatePhotoDto.rejectionReason,
      }
    );
    
    return photo;
  }

  async getUserStats() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const bannedUsers = await this.usersRepository.count({ where: { isBanned: true } });
    const verifiedUsers = await this.usersRepository.count({ where: { isVerified: true } });
    const premiumUsers = await this.usersRepository.count({ where: { isPremium: true } });
    
    // Получение количества новых пользователей по дням за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersQuery = await this.usersRepository.createQueryBuilder('user')
      .select("DATE_TRUNC('day', user.createdAt)", 'date')
      .addSelect('COUNT(user.id)', 'count')
      .where('user.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("DATE_TRUNC('day', user.createdAt)")
      .orderBy("DATE_TRUNC('day', user.createdAt)", 'ASC')
      .getRawMany();
    
    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      verifiedUsers,
      premiumUsers,
      newUsersLast30Days: newUsersQuery,
    };
  }

  async getMatchStats() {
    const totalMatches = await this.matchesRepository.count();
    
    // Статистика по статусам
    const matchesByStatus = await this.matchesRepository
      .createQueryBuilder('match')
      .select('match.status', 'status')
      .addSelect('COUNT(match.id)', 'count')
      .groupBy('match.status')
      .getRawMany();
    
    // Количество совпадений по дням за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newMatchesQuery = await this.matchesRepository.createQueryBuilder('match')
      .select("DATE_TRUNC('day', match.createdAt)", 'date')
      .addSelect('COUNT(match.id)', 'count')
      .where('match.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("DATE_TRUNC('day', match.createdAt)")
      .orderBy("DATE_TRUNC('day', match.createdAt)", 'ASC')
      .getRawMany();
    
    return {
      totalMatches,
      matchesByStatus,
      newMatchesLast30Days: newMatchesQuery,
    };
  }

  async getMessageStats() {
    const totalMessages = await this.messagesRepository.count();
    
    // Статистика по типам сообщений
    const messagesByType = await this.messagesRepository
      .createQueryBuilder('message')
      .select('message.type', 'type')
      .addSelect('COUNT(message.id)', 'count')
      .groupBy('message.type')
      .getRawMany();
    
    // Количество сообщений по дням за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const messagesPerDayQuery = await this.messagesRepository.createQueryBuilder('message')
      .select("DATE_TRUNC('day', message.createdAt)", 'date')
      .addSelect('COUNT(message.id)', 'count')
      .where('message.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("DATE_TRUNC('day', message.createdAt)")
      .orderBy("DATE_TRUNC('day', message.createdAt)", 'ASC')
      .getRawMany();
    
    return {
      totalMessages,
      messagesByType,
      messagesPerDayLast30Days: messagesPerDayQuery,
    };
  }

  async getPhotoStats() {
    const totalPhotos = await this.photosRepository.count();
    const moderatedPhotos = await this.photosRepository.count({ where: { isModerated: true } });
    const approvedPhotos = await this.photosRepository.count({ where: { isApproved: true } });
    const rejectedPhotos = await this.photosRepository.count({ 
      where: { isModerated: true, isApproved: false } 
    });
    
    // Количество фотографий по дням за последние 30 дней
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const photosPerDayQuery = await this.photosRepository.createQueryBuilder('photo')
      .select("DATE_TRUNC('day', photo.createdAt)", 'date')
      .addSelect('COUNT(photo.id)', 'count')
      .where('photo.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("DATE_TRUNC('day', photo.createdAt)")
      .orderBy("DATE_TRUNC('day', photo.createdAt)", 'ASC')
      .getRawMany();
    
    return {
      totalPhotos,
      moderatedPhotos,
      approvedPhotos,
      rejectedPhotos,
      unmoderatedPhotos: totalPhotos - moderatedPhotos,
      photosPerDayLast30Days: photosPerDayQuery,
    };
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 20,
    action?: string,
    userId?: string,
    adminId?: string,
  ) {
    const skip = (page - 1) * limit;
    
    const query = this.auditLogRepository.createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .leftJoinAndSelect('auditLog.admin', 'admin')
      .leftJoinAndSelect('user.profile', 'userProfile')
      .leftJoinAndSelect('admin.profile', 'adminProfile')
      .orderBy('auditLog.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    
    if (action) {
      query.andWhere('auditLog.action = :action', { action });
    }
    
    if (userId) {
      query.andWhere('auditLog.userId = :userId', { userId });
    }
    
    if (adminId) {
      query.andWhere('auditLog.adminId = :adminId', { adminId });
    }
    
    const [auditLogs, total] = await query.getManyAndCount();
    
    return {
      auditLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async createAuditLog(
    action: AuditLogAction,
    userId: string,
    adminId: string,
    details: any = {},
    before: any = {},
    after: any = {},
  ) {
    const auditLog = this.auditLogRepository.create({
      action,
      userId,
      adminId,
      details,
      before,
      after,
    });
    
    await this.auditLogRepository.save(auditLog);
    
    return auditLog;
  }
}