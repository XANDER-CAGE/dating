import { IsNotEmpty, IsString, IsUUID, IsEnum, IsOptional, IsUrl } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class CreateMessageDto {
  @IsUUID()
  @IsNotEmpty()
  matchId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @IsUrl()
  @IsOptional()
  mediaUrl?: string;
}