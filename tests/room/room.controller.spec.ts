import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from '../../src/room/room.controller';
import { RoomService } from '../../src/room/room.service';
import { JoinRoomDto } from '../../src/room/dto/join-room.dto';
import { CreateRoomDto } from '../../src/room/dto/create-room.dto';
import { AddUserToRoomDto } from '../../src/room/dto/add-user-to-room.dto';

describe('RoomController', () => {
  let controller: RoomController;
  let roomService: RoomService;

  const mockRoomService = {
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    addUserToRoom: jest.fn(),
    findOrCreateRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomController],
      providers: [
        {
          provide: RoomService,
          useValue: mockRoomService,
        },
      ],
    }).compile();

    controller = module.get<RoomController>(RoomController);
    roomService = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('createRoom', () => {
    it('should create a room', async () => {
      const createRoomDto: CreateRoomDto = {
        name: 'Test Room',
        isGroup: true,
        usernames: ['user1', 'user2'],
      };
      const room = { ...createRoomDto, id: 1 };

      mockRoomService.createRoom.mockResolvedValue(room);

      const result = await controller.createRoom(createRoomDto);
      expect(result).toEqual(room);
      expect(mockRoomService.createRoom).toHaveBeenCalledWith(createRoomDto);
    });
  });

  describe('joinRoom', () => {
    it('should allow a user to join a room', async () => {
      const roomId = 1;
      const joinRoomDto: JoinRoomDto = { username: 'testuser' };
      const room = { id: roomId, userRooms: [] };

      mockRoomService.joinRoom.mockResolvedValue(room);

      const result = await controller.joinRoom(roomId, joinRoomDto);
      expect(result).toEqual(room);
      expect(mockRoomService.joinRoom).toHaveBeenCalledWith(
        roomId,
        joinRoomDto,
      );
    });
  });

  describe('addUserToRoom', () => {
    it('should add a user to a room', async () => {
      const addUserToRoomDto: AddUserToRoomDto = {
        roomId: 1,
        userId: 1,
        personalizedRoomName: 'Custom Room Name',
      };
      const userRoom = {
        room: { id: addUserToRoomDto.roomId },
        user: { id: addUserToRoomDto.userId },
        personalizedRoomName: addUserToRoomDto.personalizedRoomName,
        joinedAt: new Date(),
      };

      mockRoomService.addUserToRoom.mockResolvedValue(userRoom);

      const result = await controller.addUserToRoom(addUserToRoomDto);
      expect(result).toEqual(userRoom);
      expect(mockRoomService.addUserToRoom).toHaveBeenCalledWith(
        addUserToRoomDto,
      );
    });
  });

  describe('findOrCreateRoom', () => {
    it('should find or create a room', async () => {
      const friendId = 2;
      const req = { session: { user: { id: 1 } } };
      const room = { id: 1, name: 'user1-user2', isGroup: false };

      mockRoomService.findOrCreateRoom.mockResolvedValue(room);

      const result = await controller.findOrCreateRoom(friendId, req);
      expect(result).toEqual({ roomId: room.id });
      expect(mockRoomService.findOrCreateRoom).toHaveBeenCalledWith(
        req.session.user.id,
        friendId,
      );
    });
  });
});
