import { ApiProperty } from '@nestjs/swagger';

export class ChatResponseDto {
  @ApiProperty()
  matchId: string;

  @ApiProperty()
  partnerId: string;

  @ApiProperty()
  partnerName: string;

  @ApiProperty({ type: [String] })
  partnerPhotos: string[];

  @ApiProperty()
  lastMessage: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
    isRead: boolean;
  };

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  matchedAt: Date;
}