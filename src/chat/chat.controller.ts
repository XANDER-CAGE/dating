import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    UseGuards,
    Query,
  } from '@nestjs/common';
  import { ChatService } from './chat.service';
  import { CreateMessageDto } from './dto/create-message.dto';
  import { PaginationDto } from './dto/chat-dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { GetUser } from '../common/decorators/user.decorator';
  
  @Controller('chat')
  @UseGuards(JwtAuthGuard)
  export class ChatController {
    constructor(private readonly chatService: ChatService) {}
  
    @Post('messages')
    createMessage(
      @GetUser('userId') userId: string,
      @Body() createMessageDto: CreateMessageDto,
    ) {
      return this.chatService.createMessage(userId, createMessageDto);
    }
  
    @Get('matches/:matchId/messages')
    getMessages(
      @GetUser('userId') userId: string,
      @Param('matchId') matchId: string,
      @Query() paginationDto: PaginationDto,
    ) {
      return this.chatService.getMessages(userId, matchId, paginationDto);
    }
  
    @Post('messages/:id/read')
    markMessageAsRead(
      @GetUser('userId') userId: string,
      @Param('id') id: string,
    ) {
      return this.chatService.markAsRead(userId, id);
    }
  
    @Delete('messages/:id')
    deleteMessage(
      @GetUser('userId') userId: string,
      @Param('id') id: string,
    ) {
      return this.chatService.deleteMessage(userId, id);
    }
  }