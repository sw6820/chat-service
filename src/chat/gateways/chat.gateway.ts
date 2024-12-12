import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { CreateChatDto } from '../dto/create-chat.dto';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    // origin:
    // '*',
    origin: [
      'https://*.chat-service-frontend.pages.dev',
      'https://chat-service-frontend.pages.dev',
      'http://localhost:3000',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
    ], // The front-end origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private chatService: ChatService,
    private readonly jwtService: JwtService,
  ) {}

  afterInit(server: Server) {
    console.log(`WebSocket ${server} initialized`);
    // console.log(`server keys : ${Object.keys(server)}`);
    // console.log(`server values : ${Object.values(server)}`);
    // console.log(`soc : ${JSON.stringify(server.sockets)}`);
    // console.log(`server: ${server.name}`);
  }

  handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      console.log(`verify jwt token: ${token}`);
      const payload = this.jwtService.verify(token);

      client.data.user = payload;
      console.log('User connected:', payload);
    } catch (err) {
      client.disconnect();
    }
    // console.log(`Client connected: ${client.id}`);
    // console.log(`client keys : ${Object.keys(client)}`);
    // console.log(`client values : ${Object.values(client)}`);
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
      console.log(`message received : ${JSON.stringify(createChatDto)}`);
      // console.log('Received message:', message);
      const { roomId, userId, content } = createChatDto;
      // console.log(`Send message from userId: ${userId} to roomId: ${roomId}`);
      console.log(
        `Received message: userId=${userId}, roomId=${roomId}, content="${content}"`,
      );

      // if (isNaN(userId) || isNaN(roomId) || !content) {
      //   // console.log(
      //   //   `Invalid userId or roomId: userId=${userId}, roomId=${roomId}`,
      //   // );
      //   throw new Error('Invalid user ID or room ID');
      // }
      if (isNaN(userId) || isNaN(roomId) || !content.trim()) {
        throw new WsException(
          'Invalid user ID, room ID, or empty message content',
        );
      }

      if (!client.rooms.has(`room-${roomId}`)) {
        console.log(`User ${userId} is not in room ${roomId}. Joining now.`);
        await client.join(`room-${roomId}`);
      }
      console.log(`require message`);
      const message = await this.chatService.sendMessage(createChatDto);
      console.log(`message from chat service ${message}`);
      const timestamp = new Date().toLocaleTimeString(); // Get current timestamp

      // console.log();
      // this.server
      //   .to(`room-${roomId}`)
      //   .emit('newMessage', { ...message, timestamp });
      console.log(`Broadcasting message to room-${roomId}`);
      // console.log(`message: ${Object.keys(message)}`);
      // console.log(`user, id ${JSON.stringify(message.user)}`);
      this.server.to(`room-${roomId}`).emit('newMessage', {
        ...message,
        timestamp,
        // senderUserId: userId, // Include this to help frontend distinguish sender
      });
      // return { success: true };
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
