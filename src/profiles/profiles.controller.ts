import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Request,
    UseGuards,
    Query,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { ProfilesService } from './profiles.service';
  import { CreateProfileDto } from './dto/create-profile.dto';
  import { UpdateProfileDto } from './dto/update-profile.dto';
  import { ProfileResponseDto } from './dto/profile-response.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('Profiles')
  @Controller('profiles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class ProfilesController {
    constructor(private profilesService: ProfilesService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create user profile' })
    @ApiResponse({ status: 201, description: 'Profile created successfully', type: ProfileResponseDto })
    @ApiResponse({ status: 409, description: 'Profile already exists' })
    async create(@Request() req, @Body() createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
      return this.profilesService.create(req.user.id, createProfileDto);
    }
  
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
    async getMyProfile(@Request() req): Promise<ProfileResponseDto> {
      const profile = await this.profilesService.findByUserId(req.user.id);
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      return profile;
    }
  
    @Put('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully', type: ProfileResponseDto })
    async updateMyProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
      return this.profilesService.update(req.user.id, updateProfileDto);
    }
  
    @Get('candidates')
    @ApiOperation({ summary: 'Get potential matches' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of candidates to return' })
    @ApiResponse({ status: 200, description: 'Candidates retrieved successfully', type: [ProfileResponseDto] })
    async getCandidates(
      @Request() req,
      @Query('limit') limit?: number
    ): Promise<ProfileResponseDto[]> {
      return this.profilesService.findCandidates(req.user.id, limit || 10);
    }
  
    @Post('photos')
    @ApiOperation({ summary: 'Add photo to profile' })
    @ApiResponse({ status: 200, description: 'Photo added successfully' })
    async addPhoto(@Request() req, @Body('photoUrl') photoUrl: string): Promise<ProfileResponseDto> {
      return this.profilesService.addPhoto(req.user.id, photoUrl);
    }
  
    @Delete('photos')
    @ApiOperation({ summary: 'Remove photo from profile' })
    @ApiResponse({ status: 200, description: 'Photo removed successfully' })
    async removePhoto(@Request() req, @Body('photoUrl') photoUrl: string): Promise<ProfileResponseDto> {
      return this.profilesService.removePhoto(req.user.id, photoUrl);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get profile by ID' })
    @ApiResponse({ status: 200, description: 'Profile retrieved successfully', type: ProfileResponseDto })
    async getProfile(@Param('id') id: string): Promise<ProfileResponseDto> {
      const profile = await this.profilesService.findById(id);
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      return profile;
    }
  }