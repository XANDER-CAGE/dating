import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Match } from '../../matches/entities/match.entity';
  
  export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    GIF = 'gif',
    STICKER = 'sticker',
  }
  
  @Entity('messages')
  @Index(['matchId', 'createdAt'])
  @Index(['senderId', 'createdAt'])
  export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    matchId: string;
  
    @Column()
    senderId: string;
  
    @Column({ type: 'text' })
    content: string;
  
    @Column({
      type: 'enum',
      enum: MessageType,
      default: MessageType.TEXT,
    })
    messageType: MessageType;
  
    @Column({ default: false })
    isRead: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    readAt: Date;
  
    @Column({ default: false })
    isEdited: boolean;
  
    @Column({ type: 'timestamp', nullable: true })
    editedAt: Date;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @ManyToOne(() => Match, (match) => match.messages)
    @JoinColumn({ name: 'matchId' })
    match: Match;
  
    @ManyToOne(() => User)
    @JoinColumn({ name: 'senderId' })
    sender: User;
  }