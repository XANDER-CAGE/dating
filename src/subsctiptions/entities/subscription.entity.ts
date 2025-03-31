import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  export enum SubscriptionPlan {
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
  }
  
  export enum SubscriptionStatus {
    ACTIVE = 'active',
    CANCELLED = 'cancelled',
    EXPIRED = 'expired',
    PAYMENT_FAILED = 'payment_failed',
  }
  
  export enum PaymentProvider {
    STRIPE = 'stripe',
    PAYPAL = 'paypal',
    APPLE = 'apple',
    GOOGLE = 'google',
  }
  
  @Entity('subscriptions')
  export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({
      type: 'enum',
      enum: SubscriptionPlan,
      default: SubscriptionPlan.MONTHLY,
    })
    plan: SubscriptionPlan;
  
    @Column({
      type: 'enum',
      enum: SubscriptionStatus,
      default: SubscriptionStatus.ACTIVE,
    })
    status: SubscriptionStatus;
  
    @Column({
      type: 'enum',
      enum: PaymentProvider,
    })
    paymentProvider: PaymentProvider;
  
    @Column({ nullable: true })
    externalId: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;
  
    @Column()
    currency: string;
  
    @Column()
    startDate: Date;
  
    @Column()
    endDate: Date;
  
    @Column({ default: false })
    autoRenew: boolean;
  
    @Column({ nullable: true })
    cancellationDate: Date;
  
    @Column({ nullable: true, type: 'jsonb' })
    metadata: any;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }