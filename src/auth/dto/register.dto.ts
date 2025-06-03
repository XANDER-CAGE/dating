import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+79991234567', required: false })
  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsString()
  @MinLength(8)
  password: string;
}