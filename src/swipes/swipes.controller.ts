import {
    Controller,
    Post,
    Get,
    Delete,
    Body,
    Request,
    UseGuards,
    Query,
    ParseIntPipe,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { SwipesService } from './swipes.service';
  import { CreateSwipeDto } from './dto/create-swipe.dto';
  import { SwipeResponseDto } from './dto/swipe-response.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('Swipes')
  @Controller('swipes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class SwipesController {
    constructor(private swipesService: SwipesService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a swipe (like/dislike/super_like)' })
    @ApiResponse({ status: 201, description: 'Swipe created successfully', type: SwipeResponseDto })
    @ApiResponse({ status: 400, description: 'Bad request - already swiped or invalid action' })
    async createSwipe(@Request() req, @Body() createSwipeDto: CreateSwipeDto): Promise<SwipeResponseDto> {
      const { swipe, isMatch, matchId } = await this.swipesService.createSwipe(
        req.user.id,
        createSwipeDto
      );
  
      return {
        id: swipe.id,
        swipedId: swipe.swipedId,
        action: swipe.action,
        isMatch,
        matchId,
        createdAt: swipe.createdAt,
      };
    }
  
    @Get('history')
    @ApiOperation({ summary: 'Get swipe history' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Swipe history retrieved successfully' })
    async getSwipeHistory(
      @Request() req,
      @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
      @Query('offset', new ParseIntPipe({ optional: true })) offset?: number
    ) {
      return this.swipesService.getSwipeHistory(
        req.user.id,
        limit || 50,
        offset || 0
      );
    }
  
    @Delete('undo')
    @ApiOperation({ summary: 'Undo last swipe' })
    @ApiResponse({ status: 200, description: 'Last swipe undone successfully' })
    @ApiResponse({ status: 400, description: 'Cannot undo swipe (too old or no swipes)' })
    async undoLastSwipe(@Request() req): Promise<{ message: string }> {
      await this.swipesService.undoLastSwipe(req.user.id);
      return { message: 'Last swipe undone successfully' };
    }
  }