import { IsEmail, IsOptional, IsPhoneNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsPhoneNumber('RU')
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}