import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;
}