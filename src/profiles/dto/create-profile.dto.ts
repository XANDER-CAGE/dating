import {
    IsString,
    IsNumber,
    IsEnum,
    IsOptional,
    IsArray,
    IsBoolean,
    Min,
    Max,
    MaxLength,
  } from 'class-validator';
  import { ApiProperty } from '@nestjs/swagger';
  import { Gender, InterestedIn } from '../entities/profile.entity';
  
  export class CreateProfileDto {
    @ApiProperty({ example: 'Анна' })
    @IsString()
    @MaxLength(50)
    name: string;
  
    @ApiProperty({ example: 'Люблю путешествия и хорошую музыку', required: false })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    bio?: string;
  
    @ApiProperty({ example: 25 })
    @IsNumber()
    @Min(18)
    @Max(100)
    age: number;
  
    @ApiProperty({ enum: Gender, example: Gender.FEMALE })
    @IsEnum(Gender)
    gender: Gender;
  
    @ApiProperty({ enum: InterestedIn, example: InterestedIn.MALE })
    @IsEnum(InterestedIn)
    interestedIn: InterestedIn;
  
    @ApiProperty({ example: 55.7558, required: false, description: 'Широта' })
    @IsOptional()
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;
  
    @ApiProperty({ example: 37.6176, required: false, description: 'Долгота' })
    @IsOptional()
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;
  
    @ApiProperty({ example: 50, required: false, description: 'Максимальное расстояние поиска в км' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(1000)
    maxDistance?: number;
  
    @ApiProperty({ 
      example: ['путешествия', 'музыка', 'спорт'], 
      required: false,
      type: [String]
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    interests?: string[];
  
    @ApiProperty({ 
      example: true, 
      required: false, 
      description: 'Показывать ли местоположение другим пользователям'
    })
    @IsOptional()
    @IsBoolean()
    isLocationVisible?: boolean = true;
  
    @ApiProperty({ 
      example: 'Москва', 
      required: false, 
      description: 'Город (заполняется автоматически)'
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;
  
    @ApiProperty({ 
      example: 'Россия', 
      required: false, 
      description: 'Страна (заполняется автоматически)'
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    country?: string;
  }