import { IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class MatchFilterDto {
  @IsEnum(MatchStatus, { each: true })
  @IsOptional()
  status?: MatchStatus[];

  @IsBoolean()
  @IsOptional()
  unreadOnly?: boolean;
}