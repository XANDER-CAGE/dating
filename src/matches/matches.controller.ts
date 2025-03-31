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
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchFilterDto } from './dto/match-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/user.decorator';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(
    @GetUser('userId') userId: string,
    @Body() createMatchDto: CreateMatchDto,
  ) {
    return this.matchesService.create(userId, createMatchDto);
  }

  @Get()
  findAll(
    @GetUser('userId') userId: string,
    @Query() filterDto: MatchFilterDto,
  ) {
    return this.matchesService.findAll(userId, filterDto);
  }

  @Get('recommendations')
  getRecommendations(
    @GetUser('userId') userId: string,
    @Query('limit') limit: number,
  ) {
    return this.matchesService.getRecommendations(userId, limit);
  }

  @Get(':id')
  findOne(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.matchesService.findOne(userId, id);
  }

  @Patch(':id')
  update(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateMatchDto: UpdateMatchDto,
  ) {
    return this.matchesService.update(userId, id, updateMatchDto);
  }

  @Patch(':id/read')
  markAsRead(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.matchesService.updateReadStatus(userId, id);
  }

  @Delete(':id')
  remove(
    @GetUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.matchesService.remove(userId, id);
  }
}