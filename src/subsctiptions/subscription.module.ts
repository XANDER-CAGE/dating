import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { Subscription } from './entities/subscription.entity';
import { Payment } from './entities/payment.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Payment, User]),
    ScheduleModule.forRoot(),
    UsersModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}