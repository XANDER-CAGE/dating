import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
  } from 'typeorm';
  import { Exclude } from 'class-transformer';
  import { Profile } from '../../profiles/entities/profile.entity';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column({ unique: true, nullable: true })
    phone: string;
  
    @Column()
    @Exclude()
    passwordHash: string;
  
    @Column({ default: false })
    isVerified: boolean;
  
    @Column({ default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  
    @OneToOne(() => Profile, (profile) => profile.user)
    profile: Profile;
  }