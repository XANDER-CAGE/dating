import {
    Controller,
    Get,
    Put,
    Delete,
    Body,
    Request,
    UseGuards,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { UsersService } from './users.service';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { User } from './entities/user.entity';
  
  @ApiTags('Users')
  @Controller('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class UsersController {
    constructor(private usersService: UsersService) {}
  
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    async getProfile(@Request() req): Promise<Partial<User>> {
      const user = await this.usersService.findById(req.user.id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  
    @Put('me')
    @ApiOperation({ summary: 'Update current user' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<Partial<User>> {
      const user = await this.usersService.update(req.user.id, updateUserDto);
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
  
    @Delete('me')
    @ApiOperation({ summary: 'Delete current user account' })
    @ApiResponse({ status: 200, description: 'User account deleted successfully' })
    async deleteAccount(@Request() req): Promise<{ message: string }> {
      const deleted = await this.usersService.delete(req.user.id);
      if (!deleted) {
        throw new NotFoundException('User not found');
      }
      return { message: 'Account deleted successfully' };
    }
  }