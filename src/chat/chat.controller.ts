import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedSessionGuard } from '../auth/guards/local.auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthenticatedSessionGuard)
  @Get(':roomId')
  async getChatRoom(@Param('roomId') roomId: number, @Req() req: any) {
    const userId = req.session.user.id;
    const messages = await this.chatService.getChatLogs(roomId, userId);
    return { messages };
  }

  @UseGuards(AuthenticatedSessionGuard)
  @Get('rooms/:roomId/logs')
  async getRoomLogs(@Param('roomId') roomId: number, @Req() req: any) {
    const userId = req.session.user.id;
    const messages = await this.chatService.getChatLogs(roomId, userId);
    return { messages };
  }

  @Get('rooms/:userId')
  getRoomsByUser(@Param('userId') userId: number) {
    return this.chatService.findRoomsByUserId(userId);
  }

  @Patch('rooms/:roomId/name')
  @UseGuards(AuthGuard())
  async changeRoomName(
    @Param('roomId') roomId: number,
    @Body('newRoomName') newRoomName: string,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.chatService.updateRoomNameForUser(userId, roomId, newRoomName);
  }
}
