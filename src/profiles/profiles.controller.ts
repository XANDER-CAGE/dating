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
    ParseUUIDPipe,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { ProfilesService } from './profiles.service';
  import { CreateProfileDto } from './dto/create-profile.dto';
  import { UpdateProfileDto } from './dto/update-profile.dto';
  import { UpdateLocationDto } from './dto/update-location.dto';
  import { SearchNearbyDto } from './dto/search-nearby.dto';
  import { ProfileResponseDto } from './dto/profile-response.dto';
  import { ProfileWithDistanceDto } from './dto/profile-with-distance.dto';
  import { LocationStatsDto } from './dto/location-stats.dto';
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
  
    @Put('me/location')
    @ApiOperation({ summary: 'Update user location' })
    @ApiResponse({ status: 200, description: 'Location updated successfully', type: ProfileResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid coordinates' })
    async updateLocation(@Request() req, @Body() updateLocationDto: UpdateLocationDto): Promise<ProfileResponseDto> {
      const coordinates = {
        latitude: updateLocationDto.latitude,
        longitude: updateLocationDto.longitude,
      };
      
      const profile = await this.profilesService.updateLocation(
        req.user.id, 
        coordinates, 
        updateLocationDto.accuracy
      );
  
      // Обновляем видимость локации если указано
      if (updateLocationDto.isLocationVisible !== undefined) {
        return this.profilesService.update(req.user.id, {
          isLocationVisible: updateLocationDto.isLocationVisible,
        });
      }
  
      return profile;
    }
  
    @Get('candidates')
    @ApiOperation({ summary: 'Get potential matches (basic algorithm)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of candidates to return' })
    @ApiResponse({ status: 200, description: 'Candidates retrieved successfully', type: [ProfileResponseDto] })
    async getCandidates(
      @Request() req,
      @Query('limit') limit?: number
    ): Promise<ProfileResponseDto[]> {
      return this.profilesService.findCandidates(req.user.id, limit || 10);
    }
  
    @Post('search/nearby')
    @ApiOperation({ summary: 'Search profiles by location (geolocation-based)' })
    @ApiResponse({ 
      status: 200, 
      description: 'Location-based search completed successfully', 
      type: [ProfileWithDistanceDto] 
    })
    @ApiResponse({ status: 400, description: 'Invalid search parameters' })
    async searchNearby(
      @Request() req, 
      @Body() searchDto: SearchNearbyDto
    ): Promise<ProfileWithDistanceDto[]> {
      const searchParams = {
        coordinates: {
          latitude: searchDto.latitude,
          longitude: searchDto.longitude,
        },
        maxDistance: searchDto.maxDistance,
        minAge: searchDto.minAge,
        maxAge: searchDto.maxAge,
        interestedIn: searchDto.interestedIn,
        limit: searchDto.limit,
        offset: searchDto.offset,
      };
  
      return this.profilesService.findCandidatesByLocation(req.user.id, searchParams);
    }
  
    @Get('search/city/:cityName')
    @ApiOperation({ summary: 'Search profiles by city name' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'City search completed successfully', type: [ProfileResponseDto] })
    async searchByCity(
      @Param('cityName') cityName: string,
      @Query('limit') limit?: number
    ): Promise<ProfileResponseDto[]> {
      return this.profilesService.findProfilesByCity(cityName, limit || 20);
    }
  
    @Get('stats/location')
    @ApiOperation({ summary: 'Get location statistics' })
    @ApiResponse({ status: 200, description: 'Location statistics retrieved', type: LocationStatsDto })
    async getLocationStats(): Promise<LocationStatsDto> {
      return this.profilesService.getLocationStats();
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
    @ApiResponse({ status: 400, description: 'Invalid UUID format' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async getProfile(@Param('id', ParseUUIDPipe) id: string): Promise<ProfileResponseDto> {
      const profile = await this.profilesService.findById(id);
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }
      return profile;
    }
  }