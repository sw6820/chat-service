import { Test, TestingModule } from '@nestjs/testing';
import { ChatController } from '../../src/chat/chat.controller';
import { ChatService } from '../../src/chat/chat.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedSessionGuard } from '../../src/auth/guards/local.auth.guard';
describe('ChatController', () => {
  let chatController: ChatController;
  let chatService: ChatService;

  const mockChatService = {
    getChatLogs: jest.fn(),
    findRoomsByUserId: jest.fn(),
    updateRoomNameForUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    })
      .overrideGuard(AuthenticatedSessionGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          request.session = { user: { id: 1 } }; // Mocked session user ID
          return true;
        }),
      })
      .compile();

    chatController = module.get<ChatController>(ChatController);
    chatService = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(chatController).toBeDefined();
  });

  describe('getChatRoom', () => {
    it('should return chat logs for a room', async () => {
      const roomId = 1;
      const userId = 1;
      const messages = [{ id: 1, content: 'Hello' }];
      mockChatService.getChatLogs.mockResolvedValue(messages);

      const req = { session: { user: { id: userId } } };
      const result = await chatController.getChatRoom(roomId, req as any);

      expect(result).toEqual({ messages });
      expect(mockChatService.getChatLogs).toHaveBeenCalledWith(roomId, userId);
    });
  });

  describe('getRoomLogs', () => {
    it('should return chat logs for a room', async () => {
      const roomId = 1;
      const userId = 1;
      const messages = [{ id: 1, content: 'Hello' }];
      mockChatService.getChatLogs.mockResolvedValue(messages);

      const req = { session: { user: { id: userId } } };
      const result = await chatController.getRoomLogs(roomId, req as any);

      expect(result).toEqual({ messages });
      expect(mockChatService.getChatLogs).toHaveBeenCalledWith(roomId, userId);
    });
  });

  describe('getRoomsByUser', () => {
    it('should return rooms for a user', async () => {
      const userId = 1;
      const rooms = [
        { id: 1, name: 'Room 1' },
        { id: 2, name: 'Room 2' },
      ];
      mockChatService.findRoomsByUserId.mockResolvedValue(rooms);

      const result = await chatController.getRoomsByUser(userId);
      expect(result).toEqual(rooms);
      expect(mockChatService.findRoomsByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('changeRoomName', () => {
    it('should change the room name', async () => {
      const roomId = 1;
      const newRoomName = 'New Room Name';
      const req = { user: { id: 1 } };

      mockChatService.updateRoomNameForUser.mockResolvedValue(undefined);

      await chatController.changeRoomName(roomId, newRoomName, req as any);
      expect(mockChatService.updateRoomNameForUser).toHaveBeenCalledWith(
        req.user.id,
        roomId,
        newRoomName,
      );
    });
  });
});
