import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    JoinColumn,
    OneToMany,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Message } from '../../chat/entities/message.entity';
  
  export enum MatchStatus {
    PENDING = 'pending',   // Один пользователь лайкнул другого
    MATCHED = 'matched',   // Оба пользователя лайкнули друг друга
    REJECTED = 'rejected', // Один пользователь отклонил другого
    EXPIRED = 'expired',   // Срок мэтча истек
    BLOCKED = 'blocked',   // Один пользователь заблокировал другого
  }
  
  @Entity('matches')
  export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, user => user.matches)
    @JoinColumn({ name: 'user1_id' })
    user1: User;
  
    @Column()
    user1_id: string;
  
    @ManyToOne(() => User, user => user.matches)
    @JoinColumn({ name: 'user2_id' })
    user2: User;
  
    @Column()
    user2_id: string;
  
    @Column({
      type: 'enum',
      enum: MatchStatus,
      default: MatchStatus.PENDING,
    })
    status: MatchStatus;
  
    @OneToMany(() => Message, message => message.match)
    messages: Message[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @Column({ nullable: true })
    lastMessageAt: Date;
  
    @Column({ default: false })
    isRead1: boolean; // Пользователь 1 прочитал последнее сообщение
  
    @Column({ default: false })
    isRead2: boolean; // Пользователь 2 прочитал последнее сообщение
  }