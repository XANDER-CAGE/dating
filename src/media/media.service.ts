import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Photo)
    private readonly photosRepository: Repository<Photo>,
    private readonly configService: ConfigService,
  ) {}

  async findById(id: string): Promise<Photo> {
    const photo = await this.photosRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    
    if (!photo) {
      throw new NotFoundException(`Фото с ID "${id}" не найдено`);
    }
    
    return photo;
  }

  async findByUserId(userId: string): Promise<Photo[]> {
    return this.photosRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async setMainPhoto(userId: string, photoId: string): Promise<Photo> {
    // Проверяем, что фото существует и принадлежит пользователю
    const photo = await this.photosRepository.findOne({
      where: { id: photoId, userId },
    });
    
    if (!photo) {
      throw new NotFoundException(`Фото с ID "${photoId}" не найдено`);
    }
    
    // Проверяем, что фото прошло модерацию
    if (!photo.isModerated || !photo.isApproved) {
      throw new BadRequestException('Фото должно быть одобрено модератором');
    }
    
    // Сбрасываем флаг основного фото для всех фото пользователя
    await this.photosRepository.update(
      { userId },
      { isMain: false }
    );
    
    // Устанавливаем новое основное фото
    photo.isMain = true;
    await this.photosRepository.save(photo);
    
    return photo;
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    const photo = await this.photosRepository.findOne({
      where: { id: photoId, userId },
    });
    
    if (!photo) {
      throw new NotFoundException(`Фото с ID "${photoId}" не найдено`);
    }
    
    // Удаляем фото из хранилища (функция реализуется в зависимости от выбранного хранилища)
    // await this.deletePhotoFromStorage(photo.url);
    // if (photo.thumbnailUrl) {
    //   await this.deletePhotoFromStorage(photo.thumbnailUrl);
    // }
    
    // Удаляем запись из базы данных
    await this.photosRepository.remove(photo);
  }
}