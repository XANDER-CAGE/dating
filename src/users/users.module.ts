import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Interest } from './entities/interest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, Interest]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}