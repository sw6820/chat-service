import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from '../../src/chat/gateways/chat.gateway';
import { ChatService } from '../../src/chat/chat.service';
import { CreateChatDto } from '../../src/chat/dto/create-chat.dto';
import { Server, Socket } from 'socket.io';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;
  let server: Server;

  const mockChatService = {
    sendMessage: jest.fn(),
    getChatLogs: jest.fn(),
    joinRoom: jest.fn(),
    leaveRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);

    server = new Server();
    gateway.server = server;

    // Mocking server.to().emit()
    server.to = jest.fn().mockReturnValue({
      emit: jest.fn(),
    });
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleMessage', () => {
    it('should send a message', async () => {
      const createChatDto: CreateChatDto = {
        roomId: 1,
        content: 'Hello, World!',
        userId: 1,
      };
      const client = {
        emit: jest.fn(),
      } as any as Socket;
      const message = {
        id: 1,
        content: 'Hello, World!',
        room: { id: 1 },
        user: { id: 1 },
      };

      mockChatService.sendMessage.mockResolvedValue(message);

      await gateway.handleMessage(createChatDto, client);

      expect(mockChatService.sendMessage).toHaveBeenCalledWith(createChatDto);
      expect(server.to).toHaveBeenCalledWith('room-1');
      expect(server.to('room-1').emit).toHaveBeenCalledWith(
        'newMessage',
        message,
      );
    });

    it('should emit error if user ID is invalid', async () => {
      const createChatDto: CreateChatDto = {
        roomId: NaN,
        content: 'Hello, World!',
        userId: NaN,
      };
      const client = {
        emit: jest.fn(),
      } as any as Socket;

      await gateway.handleMessage(createChatDto, client);

      expect(client.emit).toHaveBeenCalledWith(
        'error',
        'Invalid user ID or room ID',
      );
      expect(mockChatService.sendMessage).toHaveBeenCalled();
    });
  });

  describe('handleJoinRoom', () => {
    it('should allow a user to join a room', () => {
      const client = { join: jest.fn(), emit: jest.fn() } as any as Socket;
      const roomId = 1;

      gateway.handleJoinRoom(roomId, client);

      expect(client.join).toHaveBeenCalledWith(`room-${roomId}`);
      expect(client.emit).toHaveBeenCalledWith('joinedRoom', roomId);
    });
  });

  describe('handleLeaveRoom', () => {
    it('should allow a user to leave a room', () => {
      const client = { leave: jest.fn(), emit: jest.fn() } as any as Socket;
      const roomId = 1;

      gateway.handleLeaveRoom(roomId, client);

      expect(client.leave).toHaveBeenCalledWith(`room-${roomId}`);
      expect(client.emit).toHaveBeenCalledWith('leftRoom', roomId);
    });
  });

  describe('handleConnection', () => {
    it('should log a message when a client connects', () => {
      const client = { id: 'client1' } as any as Socket;
      const consoleSpy = jest.spyOn(console, 'log');

      gateway.handleConnection(client);

      expect(consoleSpy).toHaveBeenCalledWith(`Client connected: ${client.id}`);

      consoleSpy.mockRestore();
    });
  });

  describe('handleDisconnect', () => {
    it('should log a message when a client disconnects', () => {
      const client = { id: 'client1' } as any as Socket;
      const consoleSpy = jest.spyOn(console, 'log');

      gateway.handleDisconnect(client);

      expect(consoleSpy).toHaveBeenCalledWith(
        `Client disconnected: ${client.id}`,
      );

      consoleSpy.mockRestore();
    });
  });
});

// // Example tests for your gateway
// describe('ChatGateway', () => {
//   it('should broadcast messages', () => {
//     const gateway = new ChatGateway();
//     gateway.server = createMock<Server>();
//     gateway.handleMessage('hello');
//     expect(gateway.server.emit).toHaveBeenCalledWith('message', 'hello');
//   });
// });
