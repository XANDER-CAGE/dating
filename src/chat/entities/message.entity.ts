import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Match } from '../../matches/entities/match.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  LOCATION = 'location',
  SYSTEM = 'system',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Match, match => match.messages)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @Column()
  match_id: string;

  @ManyToOne(() => User, user => user.messages)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column()
  sender_id: string;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  type: MessageType;

  @Column({ nullable: true })
  mediaUrl: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}