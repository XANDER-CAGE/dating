import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class BanUserDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
