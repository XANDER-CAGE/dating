import { IsNumber, IsOptional, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ 
    example: 55.7558, 
    description: 'Широта (-90 до 90)',
    minimum: -90,
    maximum: 90
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ 
    example: 37.6176, 
    description: 'Долгота (-180 до 180)',
    minimum: -180,
    maximum: 180
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({ 
    example: 10.5, 
    description: 'Точность GPS в метрах',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Показывать ли местоположение другим пользователям',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isLocationVisible?: boolean;
}
