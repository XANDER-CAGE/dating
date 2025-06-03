import { IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SwipeAction } from '../entities/swipe.entity';

export class CreateSwipeDto {
  @ApiProperty({ description: 'ID пользователя, на которого делается свайп' })
  @IsUUID()
  swipedId: string;

  @ApiProperty({ enum: SwipeAction, example: SwipeAction.LIKE })
  @IsEnum(SwipeAction)
  action: SwipeAction;
}