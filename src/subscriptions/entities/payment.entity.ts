import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    ManyToOne,
    JoinColumn
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Subscription } from './subscription.entity';
  import { PaymentProvider } from './subscription.entity';
  
  export enum PaymentStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REFUNDED = 'refunded',
  }
  
  @Entity('payments')
  export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userId: string;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({ nullable: true })
    subscriptionId: string;
  
    @ManyToOne(() => Subscription, { nullable: true })
    @JoinColumn({ name: 'subscription_id' })
    subscription: Subscription;
  
    @Column({
      type: 'enum',
      enum: PaymentProvider,
    })
    provider: PaymentProvider;
  
    @Column({ nullable: true })
    externalId: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;
  
    @Column()
    currency: string;
  
    @Column({
      type: 'enum',
      enum: PaymentStatus,
      default: PaymentStatus.PENDING,
    })
    status: PaymentStatus;
  
    @Column({ nullable: true })
    errorMessage: string;
  
    @Column({ nullable: true, type: 'jsonb' })
    metadata: any;
  
    @CreateDateColumn()
    createdAt: Date;
  }