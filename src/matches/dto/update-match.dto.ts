import { IsEnum, IsOptional } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class UpdateMatchDto {
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsOptional()
  isRead1?: boolean;

  @IsOptional()
  isRead2?: boolean;
}
