import { IsOptional, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { MessageType } from '../entities/message.entity';

export class PaginationDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;
}

export class MessageFilterDto extends PaginationDto {
  @IsEnum(MessageType, { each: true })
  @IsOptional()
  types?: MessageType[];

  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;
}

export class ChatStatisticsDto {
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  startDate?: Date;
  
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  endDate?: Date;
}