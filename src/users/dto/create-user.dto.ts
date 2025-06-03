import { IsEmail, IsString, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;

  @IsString()
  passwordHash: string;
}