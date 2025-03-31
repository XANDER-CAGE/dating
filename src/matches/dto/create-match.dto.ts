import { IsNotEmpty, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { MatchStatus } from '../entities/match.entity';

export class CreateMatchDto {
  @IsUUID()
  @IsNotEmpty()
  targetUserId: string;
}
