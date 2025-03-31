import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    UploadedFiles,
  } from '@nestjs/common';
  import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
  import { MediaService } from './media.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  
  @Controller('media')
  @UseGuards(JwtAuthGuard)
  export class MediaController {
    constructor(private readonly mediaService: MediaService) {}
  
    @Get('photos')
    getUserPhotos(@GetUser('userId') userId: string) {
      return this.mediaService.findByUserId(userId);
    }
  
    @Post('photos')
    @UseInterceptors(FileInterceptor('file'))
    uploadPhoto(
      @GetUser('userId') userId: string,
      @UploadedFile() file: Express.Multer.File,
    ) {
      // Функция реализуется в зависимости от выбранного хранилища файлов
      // return this.mediaService.uploadPhoto(userId, file);
      return { message: 'Загрузка фото временно недоступна' };
    }
  
    @Post('photos/multiple')
    @UseInterceptors(FilesInterceptor('files', 5))
    uploadMultiplePhotos(
      @GetUser('userId') userId: string,
      @UploadedFiles() files: Express.Multer.File[],
    ) {
      // Функция реализуется в зависимости от выбранного хранилища файлов
      // return this.mediaService.uploadMultiplePhotos(userId, files);
      return { message: 'Загрузка фото временно недоступна' };
    }
  
    @Patch('photos/:id/main')
    setMainPhoto(
      @GetUser('userId') userId: string,
      @Param('id') photoId: string,
    ) {
      return this.mediaService.setMainPhoto(userId, photoId);
    }
  
    @Delete('photos/:id')
    deletePhoto(
      @GetUser('userId') userId: string,
      @Param('id') photoId: string,
    ) {
      return this.mediaService.deletePhoto(userId, photoId);
    }
  }