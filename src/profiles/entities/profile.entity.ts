import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other',
  }
  
  export enum InterestedIn {
    MALE = 'male',
    FEMALE = 'female',
    BOTH = 'both',
  }
  
  @Entity('profiles')
  export class Profile {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    userId: string;
  
    @OneToOne(() => User, (user) => user.profile)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @Column()
    name: string;
  
    @Column({ type: 'text', nullable: true })
    bio: string;
  
    @Column()
    age: number;
  
    @Column({
      type: 'enum',
      enum: Gender,
    })
    gender: Gender;
  
    @Column({
      type: 'enum',
      enum: InterestedIn,
    })
    interestedIn: InterestedIn;
  
    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    latitude: number;
  
    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    longitude: number;
  
    @Column({ default: 50 })
    maxDistance: number;
  
    @Column({ type: 'jsonb', default: '[]' })
    photos: string[];
  
    @Column({ type: 'jsonb', default: '[]' })
    interests: string[];
  
    @Column({ default: false })
    isPremium: boolean;
  
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    lastActive: Date;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }