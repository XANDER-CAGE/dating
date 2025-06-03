import {
    Controller,
    Post,
    Delete,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
  import { MediaService } from './media.service';
  import { ProfilesService } from '../profiles/profiles.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('Media')
  @Controller('media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class MediaController {
    constructor(
      private mediaService: MediaService,
      private profilesService: ProfilesService,
    ) {}
  
    @Post('profile-photo')
    @UseInterceptors(FileInterceptor('photo'))
    @ApiOperation({ summary: 'Upload profile photo' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Photo uploaded successfully' })
    async uploadProfilePhoto(
      @Request() req,
      @UploadedFile() photo: Express.Multer.File
    ) {
      if (!photo) {
        throw new BadRequestException('Photo is required');
      }
  
      const { url, thumbnailUrl } = await this.mediaService.uploadProfilePhoto(
        photo,
        req.user.id
      );
  
      // Добавляем фото в профиль пользователя
      await this.profilesService.addPhoto(req.user.id, url);
  
      return {
        url,
        thumbnailUrl,
        message: 'Photo uploaded successfully',
      };
    }
  
    @Post('chat-media/:matchId')
    @UseInterceptors(FileInterceptor('media'))
    @ApiOperation({ summary: 'Upload media for chat' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Media uploaded successfully' })
    async uploadChatMedia(
      @Request() req,
      @UploadedFile() media: Express.Multer.File,
      @Body('matchId') matchId: string
    ) {
      if (!media) {
        throw new BadRequestException('Media file is required');
      }
  
      const result = await this.mediaService.uploadChatMedia(media, matchId);
  
      return {
        ...result,
        message: 'Media uploaded successfully',
      };
    }
  
    @Delete('file')
    @ApiOperation({ summary: 'Delete uploaded file' })
    @ApiResponse({ status: 200, description: 'File deleted successfully' })
    async deleteFile(
      @Request() req,
      @Body('fileUrl') fileUrl: string
    ) {
      const deleted = await this.mediaService.deleteFile(fileUrl);
      
      if (deleted) {
        // Удаляем URL из профиля пользователя если это профильное фото
        if (fileUrl.includes('/profiles/')) {
          await this.profilesService.removePhoto(req.user.id, fileUrl);
        }
        
        return { message: 'File deleted successfully' };
      } else {
        throw new BadRequestException('Failed to delete file');
      }
    }
  }