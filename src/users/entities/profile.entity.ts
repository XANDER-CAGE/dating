import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToOne, 
  JoinColumn, 
  ManyToMany, 
  JoinTable 
} from 'typeorm';
import { User } from './user.entity';
import { Interest } from './interest.entity';
import { Point } from 'geojson';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum LookingFor {
  MEN = 'men',
  WOMEN = 'women',
  EVERYONE = 'everyone',
}

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, user => user.profile)
  @JoinColumn()
  user: User;

  @Column()
  name: string;

  @Column({ type: 'date' })
  birthDate: Date;

  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
  })
  gender: Gender;

  @Column({
    type: 'enum',
    enum: LookingFor,
    default: LookingFor.EVERYONE,
  })
  lookingFor: LookingFor;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  education: string;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', nullable: true })
  location: Point;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: 50 })
  maxDistance: number;

  @Column({ default: 18 })
  minAgePreference: number;

  @Column({ default: 100 })
  maxAgePreference: number;

  @ManyToMany(() => Interest)
  @JoinTable({
    name: 'user_interests',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'interest_id', referencedColumnName: 'id' },
  })
  interests: Interest[];
}
