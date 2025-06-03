import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  export enum SwipeAction {
    LIKE = 'like',
    DISLIKE = 'dislike',
    SUPER_LIKE = 'super_like',
  }
  
  @Entity('swipes')
  @Unique(['swiperId', 'swipedId'])
  @Index(['swiperId', 'createdAt'])
  @Index(['swipedId', 'action'])
  export class Swipe {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    swiperId: string;
  
    @Column()
    swipedId: string;
  
    @Column({
      type: 'enum',
      enum: SwipeAction,
    })
    action: SwipeAction;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'swiperId' })
    swiper: User;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'swipedId' })
    swiped: User;
  }