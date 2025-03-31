import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToOne, 
  OneToMany
} from 'typeorm';
import { Profile } from './profile.entity';
import { Match } from '../../matches/entities/match.entity';
import { Message } from '../../chat/entities/message.entity';
import { Photo } from '../../media/entities/photo.entity';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../auth/guards/roles.guard';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastActive: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({ nullable: true })
  pushToken: string;

  @Column({ nullable: true })
  deviceType: string;

  @Column({ default: false })
  isPremium: boolean;

  @Column({ nullable: true })
  premiumUntil: Date;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banReason: string;

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => Match, match => match.user1 || match.user2)
  matches: Match[];

  @OneToMany(() => Message, message => message.sender)
  messages: Message[];

  @OneToMany(() => Photo, photo => photo.user)
  photos: Photo[];
}