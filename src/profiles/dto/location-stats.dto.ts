import { ApiProperty } from '@nestjs/swagger';

class CityStatDto {
  @ApiProperty({ example: 'Москва' })
  city: string;

  @ApiProperty({ example: 150 })
  count: number;
}

class CountryStatDto {
  @ApiProperty({ example: 'Россия' })
  country: string;

  @ApiProperty({ example: 500 })
  count: number;
}

export class LocationStatsDto {
  @ApiProperty({ 
    example: 1250, 
    description: 'Общее количество пользователей с указанным местоположением'
  })
  totalWithLocation: number;

  @ApiProperty({ 
    type: [CityStatDto],
    description: 'Топ городов по количеству пользователей'
  })
  topCities: CityStatDto[];

  @ApiProperty({ 
    type: [CountryStatDto],
    description: 'Топ стран по количеству пользователей'
  })
  topCountries: CountryStatDto[];
}