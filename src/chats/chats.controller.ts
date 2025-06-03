import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Request,
    UseGuards,
    Query,
    ParseIntPipe,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { ChatsService } from './chats.service';
  import { SendMessageDto } from './dto/send-message.dto';
  import { MessageResponseDto } from './dto/message-response.dto';
  import { ChatResponseDto } from './dto/chat-response.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  
  @ApiTags('Chats')
  @Controller('chats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  export class ChatsController {
    constructor(private chatsService: ChatsService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get user chats list' })
    @ApiResponse({ status: 200, description: 'Chats retrieved successfully', type: [ChatResponseDto] })
    async getChats(@Request() req): Promise<ChatResponseDto[]> {
      return this.chatsService.getUserChats(req.user.id);
    }
  
    @Get(':matchId/messages')
    @ApiOperation({ summary: 'Get messages for a specific match' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'offset', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Messages retrieved successfully', type: [MessageResponseDto] })
    async getMessages(
      @Param('matchId') matchId: string,
      @Request() req,
      @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
      @Query('offset', new ParseIntPipe({ optional: true })) offset?: number
    ): Promise<MessageResponseDto[]> {
      return this.chatsService.getMessages(
        matchId,
        req.user.id,
        limit || 50,
        offset || 0
      );
    }
  
    @Post(':matchId/messages')
    @ApiOperation({ summary: 'Send a message' })
    @ApiResponse({ status: 201, description: 'Message sent successfully', type: MessageResponseDto })
    async sendMessage(
      @Param('matchId') matchId: string,
      @Request() req,
      @Body() sendMessageDto: SendMessageDto
    ): Promise<MessageResponseDto> {
      return this.chatsService.sendMessage(matchId, req.user.id, sendMessageDto);
    }
  
    @Put(':matchId/read')
    @ApiOperation({ summary: 'Mark messages as read' })
    @ApiResponse({ status: 200, description: 'Messages marked as read' })
    async markAsRead(
      @Param('matchId') matchId: string,
      @Request() req
    ): Promise<{ readCount: number }> {
      const readCount = await this.chatsService.markMessagesAsRead(matchId, req.user.id);
      return { readCount };
    }
  
    @Put('messages/:messageId')
    @ApiOperation({ summary: 'Edit a message' })
    @ApiResponse({ status: 200, description: 'Message edited successfully' })
    async editMessage(
      @Param('messageId') messageId: string,
      @Request() req,
      @Body('content') content: string
    ): Promise<MessageResponseDto> {
      return this.chatsService.editMessage(messageId, req.user.id, content);
    }
  
    @Delete('messages/:messageId')
    @ApiOperation({ summary: 'Delete a message' })
    @ApiResponse({ status: 200, description: 'Message deleted successfully' })
    async deleteMessage(
      @Param('messageId') messageId: string,
      @Request() req
    ): Promise<{ message: string }> {
      await this.chatsService.deleteMessage(messageId, req.user.id);
      return { message: 'Message deleted successfully' };
    }
  }