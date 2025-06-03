import { ApiProperty } from '@nestjs/swagger';
import { ProfileResponseDto } from './profile-response.dto';

export class ProfileWithDistanceDto extends ProfileResponseDto {
  @ApiProperty({ 
    example: 2.5, 
    description: 'Расстояние в километрах',
    required: false
  })
  distance?: number;

  @ApiProperty({ 
    example: '2.5 км', 
    description: 'Форматированное расстояние',
    required: false
  })
  distanceFormatted?: string;

  @ApiProperty({ 
    example: 'Москва', 
    description: 'Город пользователя',
    required: false
  })
  city?: string;

  @ApiProperty({ 
    example: 'Россия', 
    description: 'Страна пользователя',
    required: false
  })
  country?: string;
}