import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Subscription, SubscriptionPlan, SubscriptionStatus, PaymentProvider } from './entities/subscription.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionService {
  private readonly priceMap: Record<SubscriptionPlan, number>;
  private readonly planDuration: Record<SubscriptionPlan, number>; // в днях

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    // Настройка цен подписок
    this.priceMap = {
      [SubscriptionPlan.MONTHLY]: this.configService.get('SUBSCRIPTION_PRICE_MONTHLY', 9.99),
      [SubscriptionPlan.QUARTERLY]: this.configService.get('SUBSCRIPTION_PRICE_QUARTERLY', 24.99),
      [SubscriptionPlan.YEARLY]: this.configService.get('SUBSCRIPTION_PRICE_YEARLY', 79.99),
    };

    // Настройка длительности планов
    this.planDuration = {
      [SubscriptionPlan.MONTHLY]: 30, // 30 дней
      [SubscriptionPlan.QUARTERLY]: 90, // 90 дней
      [SubscriptionPlan.YEARLY]: 365, // 365 дней
    };
  }

  async createSubscription(
    userId: string,
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const { plan, paymentProvider, paymentToken, autoRenew } = createSubscriptionDto;

    // Проверяем, есть ли у пользователя активная подписка
    const activeSubscription = await this.getActiveSubscription(userId);
    if (activeSubscription) {
      throw new BadRequestException('У пользователя уже есть активная подписка');
    }

    // Получаем стоимость подписки
    const amount = this.priceMap[plan];
    const currency = 'USD'; // В реальном приложении может быть выбор валюты

    // Расчет даты начала и окончания подписки
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + this.planDuration[plan]);

    // Обработка платежа (в реальном приложении здесь был бы код для работы с платежными системами)
    let externalPaymentId;
    try {
      // Имитация обработки платежа
      externalPaymentId = `payment_${Date.now()}`;
      
      // В реальном приложении здесь был бы код для отправки запроса к платежной системе
      /*
      const paymentResult = await this.paymentGateway.processPayment({
        amount,
        currency,
        token: paymentToken,
        description: `${plan} Subscription`,
      });
      
      externalPaymentId = paymentResult.id;
      */
    } catch (error) {
      // Создаем запись о неудачном платеже
      await this.paymentRepository.save({
        userId,
        provider: paymentProvider,
        amount,
        currency,
        status: PaymentStatus.FAILED,
        errorMessage: error.message || 'Ошибка обработки платежа',
      });

      throw new BadRequestException('Ошибка обработки платежа');
    }

    // Создаем запись о подписке
    const subscription = this.subscriptionRepository.create({
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      paymentProvider,
      externalId: `subscription_${Date.now()}`,
      amount,
      currency,
      startDate,
      endDate,
      autoRenew,
    });

    await this.subscriptionRepository.save(subscription);

    // Создаем запись об успешном платеже
    await this.paymentRepository.save({
      userId,
      subscriptionId: subscription.id,
      provider: paymentProvider,
      externalId: externalPaymentId,
      amount,
      currency,
      status: PaymentStatus.COMPLETED,
      metadata: {
        subscriptionPlan: plan,
        startDate,
        endDate,
      },
    });

    // Обновляем статус премиум пользователя
    await this.userRepository.update(userId, {
      isPremium: true,
      premiumUntil: endDate,
    });

    return subscription;
  }

  async getActiveSubscription(userId: string): Promise<Subscription> {
    return this.subscriptionRepository.findOne({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(new Date()),
      },
    });
  }

  async getUserSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async cancelSubscription(userId: string, subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        id: subscriptionId,
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Активная подписка не найдена');
    }

    // Обновляем статус подписки
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancellationDate = new Date();
    subscription.autoRenew = false;

    // В реальном приложении здесь был бы код для отмены подписки в платежной системе
    /*
    await this.paymentGateway.cancelSubscription({
      subscriptionId: subscription.externalId,
      provider: subscription.paymentProvider,
    });
    */

    await this.subscriptionRepository.save(subscription);

    return subscription;
  }

  async renewSubscription(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Подписка не найдена');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE || !subscription.autoRenew) {
      throw new BadRequestException('Подписка не подлежит автоматическому продлению');
    }

    // Расчет новой даты окончания подписки
    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + this.planDuration[subscription.plan]);

    // Обработка платежа для продления подписки
    try {
      // В реальном приложении здесь был бы код для отправки запроса к платежной системе
      /*
      const paymentResult = await this.paymentGateway.renewSubscription({
        subscriptionId: subscription.externalId,
        provider: subscription.paymentProvider,
      });
      */

      const externalPaymentId = `renewal_${Date.now()}`;

      // Создаем запись об успешном платеже
      await this.paymentRepository.save({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        provider: subscription.paymentProvider,
        externalId: externalPaymentId,
        amount: subscription.amount,
        currency: subscription.currency,
        status: PaymentStatus.COMPLETED,
        metadata: {
          subscriptionPlan: subscription.plan,
          renewalDate: new Date(),
          newEndDate,
        },
      });

      // Обновляем данные подписки
      subscription.endDate = newEndDate;
      await this.subscriptionRepository.save(subscription);

      // Обновляем статус премиум пользователя
      await this.userRepository.update(subscription.userId, {
        isPremium: true,
        premiumUntil: newEndDate,
      });

      return subscription;
    } catch (error) {
      // Создаем запись о неудачном платеже
      await this.paymentRepository.save({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        provider: subscription.paymentProvider,
        amount: subscription.amount,
        currency: subscription.currency,
        status: PaymentStatus.FAILED,
        errorMessage: error.message || 'Ошибка продления подписки',
      });

      // Обновляем статус подписки
      subscription.status = SubscriptionStatus.PAYMENT_FAILED;
      await this.subscriptionRepository.save(subscription);

      throw new BadRequestException('Ошибка продления подписки');
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async checkExpiredSubscriptions(): Promise<void> {
    const now = new Date();

    // Находим просроченные активные подписки
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: LessThan(now),
      },
    });

    for (const subscription of expiredSubscriptions) {
      // Обновляем статус подписки
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subscriptionRepository.save(subscription);

      // Обновляем статус премиум пользователя
      await this.userRepository.update(subscription.userId, {
        isPremium: false,
        premiumUntil: null,
      });
    }
  }

  async processWebhook(provider: PaymentProvider, payload: any): Promise<void> {
    // В реальном приложении здесь был бы код для обработки вебхуков от платежных систем
    // Например, обработка событий "payment.succeeded", "subscription.cancelled" и т.д.
    
    console.log(`Получен вебхук от ${provider}:`, payload);
    
    // Пример обработки успешного платежа от Stripe
    if (provider === PaymentProvider.STRIPE && payload.type === 'payment_intent.succeeded') {
      const paymentIntent = payload.data.object;
      
      // Находим соответствующую подписку по внешнему ID
      const subscription = await this.subscriptionRepository.findOne({
        where: {
          paymentProvider: PaymentProvider.STRIPE,
          externalId: paymentIntent.metadata.subscriptionId,
        },
      });
      
      if (subscription) {
        // Обновляем статус платежа
        await this.paymentRepository.update(
          { externalId: paymentIntent.id },
          { status: PaymentStatus.COMPLETED },
        );
        
        // Обновляем статус подписки, если это было продление
        if (subscription.status === SubscriptionStatus.PAYMENT_FAILED) {
          subscription.status = SubscriptionStatus.ACTIVE;
          await this.subscriptionRepository.save(subscription);
          
          // Обновляем статус премиум пользователя
          await this.userRepository.update(subscription.userId, {
            isPremium: true,
            premiumUntil: subscription.endDate,
          });
        }
      }
    }
  }
}