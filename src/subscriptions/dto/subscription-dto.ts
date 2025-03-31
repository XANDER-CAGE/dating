import { IsOptional, IsDate, IsUUID, IsEnum, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { SubscriptionStatus, SubscriptionPlan } from '../entities/subscription.entity';

export class SubscriptionFilterDto {
  @IsEnum(SubscriptionStatus, { each: true })
  @IsOptional()
  status?: SubscriptionStatus[];

  @IsEnum(SubscriptionPlan, { each: true })
  @IsOptional()
  plan?: SubscriptionPlan[];

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;
  
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;
}

export class RenewSubscriptionDto {
  @IsUUID()
  @IsNotEmpty()
  subscriptionId: string;
}