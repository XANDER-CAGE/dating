import { IsNotEmpty, IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { SubscriptionPlan, PaymentProvider } from '../entities/subscription.entity';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  paymentProvider: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  paymentToken: string;

  @IsBoolean()
  @IsOptional()
  autoRenew: boolean = true;
}