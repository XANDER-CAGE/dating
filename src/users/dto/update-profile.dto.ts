import { IsOptional, IsString, IsDate, IsEnum, IsInt, Min, Max, IsArray, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { Gender, LookingFor } from '../entities/profile.entity';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @Transform(({ value }) => new Date(value))
  birthDate?: Date;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsEnum(LookingFor)
  @IsOptional()
  lookingFor?: LookingFor;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  maxDistance?: number;

  @IsInt()
  @Min(18)
  @IsOptional()
  minAgePreference?: number;

  @IsInt()
  @Min(18)
  @IsOptional()
  maxAgePreference?: number;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  interestIds?: string[];
}