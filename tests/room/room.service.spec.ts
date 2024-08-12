import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomService } from '../../src/room/room.service';
import { Room } from '../../src/room/entities/room.entity';
import { User } from '../../src/users/entities/user.entity';
import { UserRoom } from '../../src/chat/entities/user-room.entity';
import { UsersService } from '../../src/users/users.service';
import { NotFoundException } from '@nestjs/common';

describe('RoomService', () => {
  let service: RoomService;
  let roomRepository: Repository<Room>;
  let userRepository: Repository<User>;
  let userRoomRepository: Repository<UserRoom>;
  let usersService: UsersService;

  const mockRoomRepository = {
    create: jest.fn().mockImplementation((room) => room),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockUserRoomRepository = {
    create: jest.fn().mockImplementation((userRoom) => userRoom),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockUsersService = {
    findOneById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        {
          provide: getRepositoryToken(Room),
          useValue: mockRoomRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserRoom),
          useValue: mockUserRoomRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<RoomService>(RoomService);
    roomRepository = module.get<Repository<Room>>(getRepositoryToken(Room));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userRoomRepository = module.get<Repository<UserRoom>>(
      getRepositoryToken(UserRoom),
    );
    usersService = module.get<UsersService>(UsersService);
    const mockDate = new Date('2023-01-01T00:00:00Z');
    jest
      .spyOn(global, 'Date')
      .mockImplementation(() => mockDate as unknown as Date);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a room', async () => {
      const roomDetails = {
        name: 'Test Room',
        isGroup: false,
        usernames: ['user1', 'user2'],
      };
      const room = { ...roomDetails, id: 1 };

      mockRoomRepository.save.mockResolvedValue(room);

      const result = await service.createRoom(roomDetails);
      expect(result).toEqual(room);
      expect(mockRoomRepository.create).toHaveBeenCalledWith(roomDetails);
      expect(mockRoomRepository.save).toHaveBeenCalledWith(roomDetails);
    });
  });

  // describe('joinRoom', () => {
  //   it('should allow a user to join a room', async () => {
  //     const roomId = 1;
  //     const joinRoomDto = { username: 'testuser' };
  //     const user = { id: 1, username: 'testuser' };
  //     const room = { id: roomId, userRooms: [] };
  //     const userRoom = { room, user, joinedAt: new Date() };
  //
  //     mockUserRepository.findOne.mockResolvedValue(user);
  //     mockRoomRepository.findOne.mockResolvedValue(room);
  //     mockUserRoomRepository.findOne.mockResolvedValue(null);
  //     mockUserRoomRepository.save.mockResolvedValue(userRoom);
  //     mockUsersService.findOneById.mockResolvedValue(user);
  //
  //     const result = await service.joinRoom(roomId, joinRoomDto);
  //     expect(result).toEqual(room);
  //     expect(mockUserRepository.findOne).toHaveBeenCalledWith({
  //       where: { username: joinRoomDto.username },
  //     });
  //     expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
  //       where: { id: roomId },
  //       relations: ['userRooms', 'userRooms.user'],
  //     });
  //     expect(mockUserRoomRepository.create).toHaveBeenCalledWith({
  //       room: { id: roomId },
  //       user,
  //       personalizedRoomName: undefined,
  //       joinedAt: new Date(),
  //     });
  //     expect(mockUserRoomRepository.save).toHaveBeenCalledWith(userRoom);
  //   });
  //
  //   it('should throw an error if user is not found', async () => {
  //     mockUserRepository.findOne.mockResolvedValue(null);
  //
  //     await expect(
  //       service.joinRoom(1, { username: 'testuser' }),
  //     ).rejects.toThrow(NotFoundException);
  //   });
  //
  //   it('should throw an error if room is not found', async () => {
  //     const user = { id: 1, username: 'testuser' };
  //
  //     mockUserRepository.findOne.mockResolvedValue(user);
  //     mockRoomRepository.findOne.mockResolvedValue(null);
  //
  //     await expect(
  //       service.joinRoom(1, { username: 'testuser' }),
  //     ).rejects.toThrow(NotFoundException);
  //   });
  // });

  describe('addUserToRoom', () => {
    it('should add a user to a room', async () => {
      const addUserToRoomDto = {
        roomId: 1,
        userId: 1,
        personalizedRoomName: 'Custom Room Name',
      };
      const user = { id: addUserToRoomDto.userId, username: 'testuser' };
      const room = { id: addUserToRoomDto.roomId };
      const userRoom = {
        room,
        user,
        personalizedRoomName: addUserToRoomDto.personalizedRoomName,
        joinedAt: new Date(),
      };

      mockUsersService.findOneById.mockResolvedValue(user);
      mockRoomRepository.findOne.mockResolvedValue(room);
      mockUserRoomRepository.save.mockResolvedValue(userRoom);

      const result = await service.addUserToRoom(addUserToRoomDto);
      expect(result).toEqual(userRoom);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(
        addUserToRoomDto.userId,
      );
      expect(mockRoomRepository.findOne).toHaveBeenCalledWith({
        where: { id: addUserToRoomDto.roomId },
      });
      expect(mockUserRoomRepository.create).toHaveBeenCalledWith({
        room,
        user,
        personalizedRoomName: addUserToRoomDto.personalizedRoomName,
        joinedAt: new Date(),
      });
      expect(mockUserRoomRepository.save).toHaveBeenCalledWith(userRoom);
    });

    it('should throw an error if user is not found', async () => {
      mockUsersService.findOneById.mockResolvedValue(null);

      await expect(
        service.addUserToRoom({
          roomId: 1,
          userId: 1,
          personalizedRoomName: 'Custom Room Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if room is not found', async () => {
      const user = { id: 1, username: 'testuser' };

      mockUsersService.findOneById.mockResolvedValue(user);
      mockRoomRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addUserToRoom({
          roomId: 1,
          userId: 1,
          personalizedRoomName: 'Custom Room Name',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeUserFromRoom', () => {
    it('should remove a user from a room', async () => {
      const roomId = 1;
      const userId = 1;
      const userRoom = { room: { id: roomId }, user: { id: userId } };

      mockUserRoomRepository.findOne.mockResolvedValue(userRoom);

      await service.removeUserFromRoom(roomId, userId);
      expect(mockUserRoomRepository.findOne).toHaveBeenCalledWith({
        where: { room: { id: roomId }, user: { id: userId } },
      });
      expect(mockUserRoomRepository.remove).toHaveBeenCalledWith(userRoom);
    });

    it('should throw an error if user is not in room', async () => {
      mockUserRoomRepository.findOne.mockResolvedValue(null);

      await expect(service.removeUserFromRoom(1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
