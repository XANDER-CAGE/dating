import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Photo } from '../media/entities/photo.entity';
import { Match } from '../matches/entities/match.entity';
import { Message } from '../chat/entities/message.entity';
import { AuditLog } from './entities/audit-log.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Photo, Match, Message, AuditLog]),
    UsersModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}