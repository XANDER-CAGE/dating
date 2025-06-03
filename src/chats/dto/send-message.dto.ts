import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @ApiProperty({ example: 'Привет! Как дела?' })
  @IsString()
  @MaxLength(1000)
  content: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT, required: false })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;
}