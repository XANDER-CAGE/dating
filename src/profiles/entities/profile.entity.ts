import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
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

// Тип для координат
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Тип для геолокационной точки PostGIS
export interface LocationPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

@Entity('profiles')
@Index(['location'], { spatial: true }) // Пространственный индекс
@Index(['city'])
@Index(['country'])
@Index(['isLocationVisible'])
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

  // Старые поля для обратной совместимости
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  // Новые поля PostGIS
  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: LocationPoint;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  lastKnownLocation: LocationPoint;

  @Column({ type: 'timestamp', nullable: true })
  locationUpdatedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  locationAccuracy: number; // в метрах

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ default: true })
  isLocationVisible: boolean;

  @Column({ default: 50 })
  maxDistance: number; // в километрах

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

  // Виртуальные поля для удобства
  get coordinates(): Coordinates | null {
    if (this.latitude && this.longitude) {
      return {
        latitude: Number(this.latitude),
        longitude: Number(this.longitude),
      };
    }
    return null;
  }

  get locationCoordinates(): Coordinates | null {
    if (this.location?.coordinates) {
      return {
        longitude: this.location.coordinates[0],
        latitude: this.location.coordinates[1],
      };
    }
    return null;
  }
}