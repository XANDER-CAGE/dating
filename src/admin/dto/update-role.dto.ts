import { IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../auth/guards/roles.guard';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}