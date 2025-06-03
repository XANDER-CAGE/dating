import { ApiProperty } from '@nestjs/swagger';
import { Gender, InterestedIn } from '../entities/profile.entity';

export class ProfileResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  bio: string;

  @ApiProperty()
  age: number;

  @ApiProperty({ enum: Gender })
  gender: Gender;

  @ApiProperty({ enum: InterestedIn })
  interestedIn: InterestedIn;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty()
  maxDistance: number;

  @ApiProperty({ type: [String] })
  photos: string[];

  @ApiProperty({ type: [String] })
  interests: string[];

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  lastActive: Date;

  @ApiProperty()
  createdAt: Date;
}