import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { SubscriptionService } from './subscription.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  import { CreateSubscriptionDto } from './dto/subscription-dto';
  import { WebhookPayloadDto } from './dto/subscription-dto';
  import { RateLimit } from '../common/guards/rate-limiter.guard';
  import { PaymentProvider } from './entities/subscription.entity';
  
  @Controller('subscriptions')
  export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}
  
    @Post()
    @UseGuards(JwtAuthGuard)
    @RateLimit({ points: 5, duration: 3600, keyPrefix: 'subscription' }) // Ограничение на создание подписок
    createSubscription(
      @GetUser('userId') userId: string,
      @Body() createSubscriptionDto: CreateSubscriptionDto,
    ) {
      return this.subscriptionService.createSubscription(userId, createSubscriptionDto);
    }
  
    @Get()
    @UseGuards(JwtAuthGuard)
    getUserSubscriptions(@GetUser('userId') userId: string) {
      return this.subscriptionService.getUserSubscriptions(userId);
    }
  
    @Get('active')
    @UseGuards(JwtAuthGuard)
    getActiveSubscription(@GetUser('userId') userId: string) {
      return this.subscriptionService.getActiveSubscription(userId);
    }
  
    @Post(':id/cancel')
    @UseGuards(JwtAuthGuard)
    cancelSubscription(
      @GetUser('userId') userId: string,
      @Param('id') subscriptionId: string,
    ) {
      return this.subscriptionService.cancelSubscription(userId, subscriptionId);
    }
  
    @Get('payments')
    @UseGuards(JwtAuthGuard)
    getUserPayments(@GetUser('userId') userId: string) {
      return this.subscriptionService.getUserPayments(userId);
    }
  
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(@Body() webhookPayloadDto: WebhookPayloadDto) {
      const { provider, payload } = webhookPayloadDto;
      
      // Преобразуем строковый провайдер в enum
      const paymentProvider = provider.toLowerCase() as PaymentProvider;
      
      await this.subscriptionService.processWebhook(paymentProvider, payload);
      
      return { success: true };
    }
  }