import { ApiProperty } from '@nestjs/swagger';
import { SwipeAction } from '../entities/swipe.entity';

export class SwipeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  swipedId: string;

  @ApiProperty({ enum: SwipeAction })
  action: SwipeAction;

  @ApiProperty()
  isMatch: boolean;

  @ApiProperty({ required: false })
  matchId?: string;

  @ApiProperty()
  createdAt: Date;
}