import { ApiProperty } from '@nestjs/swagger';
import { MessageType } from '../entities/message.entity';

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  matchId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  messageType: MessageType;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty()
  readAt: Date;

  @ApiProperty()
  isEdited: boolean;

  @ApiProperty()
  editedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  sender: {
    id: string;
    profile: {
      name: string;
      photos: string[];
    };
  };
}