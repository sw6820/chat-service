import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { AddUserToRoomDto } from './dto/add-user-to-room.dto';
import { AuthenticatedSessionGuard } from '../auth/guards/local.auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../auth/guards/jtw.auth.guard';

@Controller('rooms')
export class RoomController {
  private readonly logger = new Logger(RoomController.name);

  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.roomService.createRoom(createRoomDto);
  }

  @Post(':roomId/join')
  async joinRoom(
    @Param('roomId') roomId: number,
    @Body() joinRoomDto: JoinRoomDto,
  ) {
    return this.roomService.joinRoom(roomId, joinRoomDto);
  }

  @Post('add-user')
  async addUserToRoom(@Body() addUserToRoomDto: AddUserToRoomDto) {
    return this.roomService.addUserToRoom(addUserToRoomDto);
  }

  // @UseGuards(AuthenticatedSessionGuard)
  @UseGuards(JwtAuthGuard)
  @Post('find-or-create')
  async findOrCreateRoom(@Body('friendId') friendId: number, @Req() req: any) {
    this.logger.log(
      `Finding or creating room for user ${req.user['userId']} and friend ${friendId}`,
    );
    try {
      // const userId = req.session.user.id;
      const userId = req.user['userId'];
      const room = await this.roomService.findOrCreateRoom(userId, friendId);
      return { roomId: room.id };
    } catch (error) {
      this.logger.error(
        `Error in findOrCreateRoom: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
