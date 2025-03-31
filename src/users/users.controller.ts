import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { UpdateProfileDto } from './dto/update-profile.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@GetUser('userId') userId: string) {
      return this.usersService.findById(userId);
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch('me/profile')
    updateProfile(
      @GetUser('userId') userId: string,
      @Body() updateProfileDto: UpdateProfileDto,
    ) {
      return this.usersService.updateProfile(userId, updateProfileDto);
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('me/interests')
    addInterests(
      @GetUser('userId') userId: string,
      @Body() body: { interestIds: string[] },
    ) {
      return this.usersService.addInterestToProfile(userId, body.interestIds);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete('me/interests/:interestId')
    removeInterest(
      @GetUser('userId') userId: string,
      @Param('interestId') interestId: string,
    ) {
      return this.usersService.removeInterestFromProfile(userId, interestId);
    }
  
    // Админ-маршруты с дополнительной защитой
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll() {
      return this.usersService.findAll();
    }
  
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string) {
      return this.usersService.findById(id);
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string) {
      return this.usersService.remove(id);
    }
  }