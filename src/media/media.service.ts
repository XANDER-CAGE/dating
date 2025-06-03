import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MediaService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];

  constructor(private configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_DEST', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 10485760); // 10MB
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async uploadProfilePhoto(
    file: Express.Multer.File,
    userId: string
  ): Promise<{ url: string; thumbnailUrl: string }> {
    // Валидация файла
    this.validateFile(file);

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const thumbnailName = `thumb_${fileName}`;
    
    const filePath = path.join(this.uploadPath, 'profiles', fileName);
    const thumbnailPath = path.join(this.uploadPath, 'profiles', 'thumbnails', thumbnailName);

    // Создаем директории если их нет
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.mkdir(path.dirname(thumbnailPath), { recursive: true });

    try {
      // Обрабатываем основное изображение
      await sharp(file.buffer)
        .resize(800, 800, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 85 })
        .toFile(filePath);

      // Создаем миниатюру
      await sharp(file.buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      // В production здесь бы загружали в CDN (Cloudinary, AWS S3)
      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
      
      return {
        url: `${baseUrl}/uploads/profiles/${fileName}`,
        thumbnailUrl: `${baseUrl}/uploads/profiles/thumbnails/${thumbnailName}`,
      };
    } catch (error) {
      throw new BadRequestException('Error processing image');
    }
  }

  async uploadChatMedia(
    file: Express.Multer.File,
    matchId: string
  ): Promise<{ url: string; type: string }> {
    this.validateFile(file);

    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, 'chats', matchId, fileName);

    await fs.mkdir(path.dirname(filePath), { recursive: true });

    try {
      // Если это изображение, оптимизируем его
      if (this.allowedMimeTypes.includes(file.mimetype)) {
        await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(filePath);
      } else {
        // Для других типов файлов просто сохраняем
        await fs.writeFile(filePath, file.buffer);
      }

      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
      
      return {
        url: `${baseUrl}/uploads/chats/${matchId}/${fileName}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'file',
      };
    } catch (error) {
      throw new BadRequestException('Error uploading file');
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const baseUrl = this.configService.get<string>('BASE_URL', 'http://localhost:3000');
      const relativePath = fileUrl.replace(`${baseUrl}/uploads/`, '');
      const filePath = path.join(this.uploadPath, relativePath);
      
      await fs.unlink(filePath);
      
      // Если это профильное фото, удаляем и миниатюру
      if (relativePath.includes('profiles/') && !relativePath.includes('thumbnails/')) {
        const thumbnailPath = path.join(
          this.uploadPath,
          'profiles/thumbnails',
          `thumb_${path.basename(filePath)}`
        );
        try {
          await fs.unlink(thumbnailPath);
        } catch {
          // Игнорируем ошибку если миниатюра не найдена
        }
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(', ')}`
      );
    }
  }
}