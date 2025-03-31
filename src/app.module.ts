import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MatchesModule } from './matches/matches.module';
import { ChatModule } from './chat/chat.module';
import { MediaModule } from './media/media.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { SubscriptionModule } from './subscriptions/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'dating_app'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC', false),
        logging: configService.get('DB_LOGGING', false),
      }),
    }),
    ScheduleModule.forRoot(),
    CommonModule,
    UsersModule,
    AuthModule,
    MatchesModule,
    ChatModule,
    MediaModule,
    AiModule,
    AdminModule,
    SubscriptionModule,
  ],
})
export class AppModule {}

        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'dating_app'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('DB_SYNC', false),
        logging: configService.get('DB_LOGGING', false),
      }),
    }),
    UsersModule,
    AuthModule,
    MatchesModule,
    ChatModule,
    MediaModule,
    AiModule,
  ],
})
export class AppModule {}