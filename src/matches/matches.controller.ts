import {
    Controller,
    Get,
    Delete,
    Param,
    Request,
    UseGuards,
    Query,
    ParseIntPipe,
    NotFoundException,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { MatchesService } from './matches.service';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('Matches')
  @Controller('matches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class MatchesController {
    constructor(private matchesService: MatchesService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get user matches' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Matches retrieved successfully' })
    async getMatches(
      @Request() req,
      @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
      @Query('offset', new ParseIntPipe({ optional: true })) offset?: number
    ) {
      return this.matchesService.getUserMatches(
        req.user.id,
        limit || 50,
        offset || 0
      );
    }
  
    @Get('count')
    @ApiOperation({ summary: 'Get matches count' })
    @ApiResponse({ status: 200, description: 'Matches count retrieved successfully' })
    async getMatchesCount(@Request() req): Promise<{ count: number }> {
      const count = await this.matchesService.getMatchesCount(req.user.id);
      return { count };
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get match by ID' })
    @ApiResponse({ status: 200, description: 'Match retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Match not found' })
    async getMatch(@Param('id') id: string, @Request() req) {
      const match = await this.matchesService.getMatchById(id);
      if (!match) {
        throw new NotFoundException('Match not found');
      }
  
      // Проверяем, что пользователь является участником матча
      if (match.user1Id !== req.user.id && match.user2Id !== req.user.id) {
        throw new NotFoundException('Match not found');
      }
  
      return match;
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Unmatch with user' })
    @ApiResponse({ status: 200, description: 'Successfully unmatched' })
    @ApiResponse({ status: 404, description: 'Match not found' })
    async unmatch(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
      await this.matchesService.unmatch(id, req.user.id);
      return { message: 'Successfully unmatched' };
    }
  }