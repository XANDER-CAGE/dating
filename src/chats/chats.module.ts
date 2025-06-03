import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { ChatsGateway } from './chats.gateway';
import { Message } from './entities/message.entity';
import { MatchesModule } from '../matches/matches.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    MatchesModule,
    JwtModule,
    ConfigModule,
  ],
  providers: [ChatsService, ChatsGateway],
  controllers: [ChatsController],
  exports: [ChatsService],
})
export class ChatsModule {}