import { IsNotEmpty, IsBoolean, IsString, IsOptional } from 'class-validator';

export class ModeratePhotoDto {
  @IsBoolean()
  @IsNotEmpty()
  isApproved: boolean;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}