import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
    Unique,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Message } from '../../chats/entities/message.entity';
  
  @Entity('matches')
  @Unique(['user1Id', 'user2Id'])
  @Index(['user1Id', 'isActive'])
  @Index(['user2Id', 'isActive'])
  export class Match {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    user1Id: string;
  
    @Column()
    user2Id: string;
  
    @Column({ default: true })
    isActive: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    lastMessageAt: Date;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user1Id' })
    user1: User;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user2Id' })
    user2: User;
  
    @OneToMany(() => Message, (message) => message.match)
    messages: Message[];
  }