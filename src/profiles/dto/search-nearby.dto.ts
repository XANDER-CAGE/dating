import { IsNumber, IsOptional, IsEnum, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Gender } from '../entities/profile.entity';

export class SearchNearbyDto {
  @ApiProperty({ 
    example: 55.7558, 
    description: 'Широта центра поиска'
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ 
    example: 37.6176, 
    description: 'Долгота центра поиска'
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ 
    example: 25, 
    description: 'Максимальное расстояние в километрах',
    required: false,
    default: 50
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  maxDistance?: number = 50;

  @ApiProperty({ 
    example: 18, 
    description: 'Минимальный возраст',
    required: false,
    default: 18
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  minAge?: number = 18;

  @ApiProperty({ 
    example: 35, 
    description: 'Максимальный возраст',
    required: false,
    default: 65
  })
  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  maxAge?: number = 65;

  @ApiProperty({ 
    enum: Gender, 
    description: 'Пол для поиска',
    required: false
  })
  @IsOptional()
  @IsEnum(Gender)
  interestedIn?: Gender;

  @ApiProperty({ 
    example: 10, 
    description: 'Количество результатов',
    required: false,
    default: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({ 
    example: 0, 
    description: 'Смещение для пагинации',
    required: false,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}