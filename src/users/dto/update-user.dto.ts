import { IsEmail, IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}