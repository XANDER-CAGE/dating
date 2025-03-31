import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
  } from '@nestjs/common';
  import { AdminService } from './admin.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { RolesGuard, Roles, UserRole } from '../auth/guards/roles.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  import { BanUserDto } from './dto/ban-user.dto';
  import { UpdateRoleDto } from './dto/update-role.dto';
  import { ModeratePhotoDto } from './dto/moderate-photo.dto';
  
  @Controller('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class AdminController {
    constructor(private readonly adminService: AdminService) {}
  
    // Управление пользователями
    @Get('users')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    getUsers(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10,
      @Query('search') search?: string,
      @Query('role') role?: UserRole,
      @Query('isActive') isActive?: boolean,
      @Query('isBanned') isBanned?: boolean,
    ) {
      return this.adminService.getUsers(page, limit, search, role, isActive, isBanned);
    }
  
    @Get('users/:id')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    getUserById(@Param('id') id: string) {
      return this.adminService.getUserById(id);
    }
  
    @Patch('users/:id/ban')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    banUser(
      @Param('id') id: string,
      @Body() banUserDto: BanUserDto,
      @GetUser('userId') adminId: string,
    ) {
      return this.adminService.banUser(id, banUserDto, adminId);
    }
  
    @Patch('users/:id/unban')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    unbanUser(
      @Param('id') id: string,
      @GetUser('userId') adminId: string,
    ) {
      return this.adminService.unbanUser(id, adminId);
    }
  
    @Patch('users/:id/role')
    @Roles(UserRole.ADMIN)
    updateUserRole(
      @Param('id') id: string,
      @Body() updateRoleDto: UpdateRoleDto,
      @GetUser('userId') adminId: string,
    ) {
      return this.adminService.updateUserRole(id, updateRoleDto.role, adminId);
    }
  
    @Delete('users/:id')
    @Roles(UserRole.ADMIN)
    deleteUser(
      @Param('id') id: string,
      @GetUser('userId') adminId: string,
    ) {
      return this.adminService.deleteUser(id, adminId);
    }
  
    // Модерация фотографий
    @Get('photos/moderation')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    getUnmoderatedPhotos(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 20,
    ) {
      return this.adminService.getUnmoderatedPhotos(page, limit);
    }
  
    @Patch('photos/:id/moderate')
    @Roles(UserRole.ADMIN, UserRole.MODERATOR)
    moderatePhoto(
      @Param('id') id: string,
      @Body() moderatePhotoDto: ModeratePhotoDto,
      @GetUser('userId') adminId: string,
    ) {
      return this.adminService.moderatePhoto(id, moderatePhotoDto, adminId);
    }
  
    // Статистика
    @Get('stats/users')
    @Roles(UserRole.ADMIN)
    getUserStats() {
      return this.adminService.getUserStats();
    }
  
    @Get('stats/matches')
    @Roles(UserRole.ADMIN)
    getMatchStats() {
      return this.adminService.getMatchStats();
    }
  
    @Get('stats/messages')
    @Roles(UserRole.ADMIN)
    getMessageStats() {
      return this.adminService.getMessageStats();
    }
  
    @Get('stats/photos')
    @Roles(UserRole.ADMIN)
    getPhotoStats() {
      return this.adminService.getPhotoStats();
    }
  
    @Get('audit-logs')
    @Roles(UserRole.ADMIN)
    getAuditLogs(
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 20,
      @Query('action') action?: string,
      @Query('userId') userId?: string,
      @Query('adminId') adminId?: string,
    ) {
      return this.adminService.getAuditLogs(page, limit, action, userId, adminId);
    }
  }