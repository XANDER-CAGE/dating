import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ConfigModule, ProfilesModule],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MediaService],
})
export class MediaModule {}