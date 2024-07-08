import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { CreateChatDto } from '../dto/create-chat.dto';

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private chatService: ChatService) {}

  afterInit(server: Server) {
    console.log(`WebSocket ${server} initialized`);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createChatDto: CreateChatDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      // console.log(`message received : ${JSON.stringify(createChatDto)}`);
      const { roomId, userId, content } = createChatDto;
      // console.log(`Send message from userId: ${userId} to roomId: ${roomId}`);
      if (isNaN(userId) || isNaN(roomId) || !content) {
        // console.log(
        //   `Invalid userId or roomId: userId=${userId}, roomId=${roomId}`,
        // );
        throw new Error('Invalid user ID or room ID');
      }
      const message = await this.chatService.sendMessage(createChatDto);
      this.server.to(`room-${roomId}`).emit('newMessage', message);
    } catch (error) {
      console.error(`Error handling message: ${error.message}`);
      client.emit('error', error.message);
    }
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody('roomId') roomId: number,
    @ConnectedSocket() client: Socket,
  ): void {
    if (roomId) {
      client.join(`room-${roomId}`);
      client.emit('joinedRoom', roomId);
      console.log(`Client ${client.id} joined room ${roomId}`);
    } else {
      client.emit('error', 'Invalid room ID');
    }
  }
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody('roomId') roomId: number,
    @ConnectedSocket() client: Socket,
  ): void {
    if (roomId) {
      client.leave(`room-${roomId}`);
      client.emit('leftRoom', roomId);
      // console.log(`Client ${client.id} left room ${roomId}`);
    } else {
      client.emit('error', 'Invalid room ID');
    }
  }
}
