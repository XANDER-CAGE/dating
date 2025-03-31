import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  birthDate?: string;
}

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileDto)
  profile?: CreateProfileDto;

  @IsOptional()
  emailVerified?: boolean;
}