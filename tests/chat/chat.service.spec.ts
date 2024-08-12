import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../../src/chat/chat.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Room } from '../../src/room/entities/room.entity';
import { Message } from '../../src/chat/entities/message.entity';
import { UserRoom } from '../../src/chat/entities/user-room.entity';
import { UsersService } from '../../src/users/users.service';
import { RoomService } from '../../src/room/room.service';
import { In, Repository } from 'typeorm';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('ChatService', () => {
  let service: ChatService;
  let userRepository: MockRepository<User>;
  let roomRepository: MockRepository<Room>;
  let messageRepository: MockRepository<Message>;
  let userRoomRepository: MockRepository<UserRoom>;
  // let usersService: UsersService;
  // let roomService: RoomService;

  const mockDate = new Date('2024-05-23T17:21:48.409Z');

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Room),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Message),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(UserRoom),
          useValue: mockRepository(),
        },
        {
          provide: UsersService,
          useValue: {
            findOneById: jest.fn(),
          },
        },
        {
          provide: RoomService,
          useValue: {
            createRoom: jest.fn(),
            addUserToRoom: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
    roomRepository = module.get<MockRepository<Room>>(getRepositoryToken(Room));
    messageRepository = module.get<MockRepository<Message>>(
      getRepositoryToken(Message),
    );
    userRoomRepository = module.get<MockRepository<UserRoom>>(
      getRepositoryToken(UserRoom),
    );
    // usersService = module.get<UsersService>(UsersService);
    // roomService = module.get<RoomService>(RoomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRoom', () => {
    it('should create a new room with users', async () => {
      const createRoomDto = {
        name: 'Test Room',
        usernames: ['user1', 'user2'],
        isGroup: true,
      };
      const users = [
        { id: 1, username: 'user1' } as User,
        { id: 2, username: 'user2' } as User,
      ];

      userRepository.find.mockResolvedValue(users);
      const room = { id: 1, name: createRoomDto.name, isGroup: true } as Room;
      roomRepository.create.mockReturnValue(room);
      roomRepository.save.mockResolvedValue(room);

      userRoomRepository.create.mockReturnValue({});
      userRoomRepository.save.mockResolvedValue({});

      const result = await service.createRoom(createRoomDto);
      expect(result).toEqual(room);
      expect(userRepository.find).toHaveBeenCalledWith({
        where: { username: In(createRoomDto.usernames) },
      });
      expect(roomRepository.create).toHaveBeenCalledWith({
        name: createRoomDto.name,
        isGroup: createRoomDto.isGroup,
      });
      expect(roomRepository.save).toHaveBeenCalledWith(room);
      expect(userRoomRepository.create).toHaveBeenCalledTimes(users.length);
      expect(userRoomRepository.save).toHaveBeenCalledTimes(users.length);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', async () => {
      const createChatDto = { roomId: 1, content: 'Hello', userId: 1 };
      const userRoom = { id: 1, room: { id: 1 }, user: { id: 1 } } as UserRoom;
      const user = { id: 1 } as User;
      const message = {
        id: 1,
        content: 'Hello',
        room: { id: 1 },
        user: { id: 1 },
        createdAt: mockDate,
      } as Message;

      userRoomRepository.findOne.mockResolvedValue(userRoom);
      userRepository.findOne.mockResolvedValue(user);
      messageRepository.create.mockReturnValue(message);
      messageRepository.save.mockResolvedValue(message);

      const result = await service.sendMessage(createChatDto);
      expect(result).toEqual(message);
      expect(userRoomRepository.findOne).toHaveBeenCalledWith({
        where: {
          room: { id: createChatDto.roomId },
          user: { id: createChatDto.userId },
        },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: createChatDto.userId },
      });
      expect(messageRepository.create).toHaveBeenCalledWith({
        content: createChatDto.content,
        room: { id: createChatDto.roomId },
        user: { id: createChatDto.userId },
        createdAt: mockDate,
      });
      expect(messageRepository.save).toHaveBeenCalledWith(message);
    });
  });

  describe('joinRoom', () => {
    it('should join a room', async () => {
      const username = 'user1';
      const roomId = 1;
      const user = { id: 1, username: 'user1' } as User;
      const room = { id: 1 } as Room;
      // const mockDate = new Date();
      const userRoom = { id: 1, user, room, joinedAt: mockDate } as UserRoom;

      userRepository.findOneBy.mockResolvedValue(user);
      roomRepository.findOneBy.mockResolvedValue(room);
      userRoomRepository.findOne.mockResolvedValue(null);
      userRoomRepository.create.mockReturnValue(userRoom);
      userRoomRepository.save.mockResolvedValue(userRoom);

      const result = await service.joinRoom(username, roomId);
      expect(result).toEqual(userRoom);
      expect(userRepository.findOneBy).toHaveBeenCalledWith({ username });
      expect(roomRepository.findOneBy).toHaveBeenCalledWith({ id: roomId });
      expect(userRoomRepository.findOne).toHaveBeenCalledWith({
        where: { user, room },
      });
      expect(userRoomRepository.create).toHaveBeenCalledWith({
        user,
        room,
        joinedAt: mockDate,
      });
      expect(userRoomRepository.save).toHaveBeenCalledWith(userRoom);
    });
  });

  describe('getChatLogs', () => {
    it('should get chat logs for a room', async () => {
      const roomId = 1;
      const userId = 1;
      const userRoom = { id: 1, room: { id: 1 }, user: { id: 1 } } as UserRoom;
      const messages: Message[] = [
        {
          id: 1,
          content: 'Hello',
          room: { id: 1 },
          user: { id: 1 },
          createdAt: mockDate,
        },
      ] as Message[];

      userRoomRepository.findOne.mockResolvedValue(userRoom);
      messageRepository.find.mockResolvedValue(messages);

      const result = await service.getChatLogs(roomId, userId);
      expect(result).toEqual(messages);
      expect(userRoomRepository.findOne).toHaveBeenCalledWith({
        where: { room: { id: roomId }, user: { id: userId } },
      });
      expect(messageRepository.find).toHaveBeenCalledWith({
        where: { room: { id: roomId } },
        order: { createdAt: 'ASC' },
        relations: ['user', 'room'],
      });
    });
  });

  describe('updateRoomNameForUser', () => {
    it('should update room name for user', async () => {
      const userId = 1;
      const roomId = 1;
      const newRoomName = 'New Room Name';
      const userRoom = {
        id: 1,
        room: { id: 1 },
        user: { id: 1 },
        personalizedRoomName: 'Old Room Name',
      } as UserRoom;

      userRoomRepository.findOne.mockResolvedValue(userRoom);

      await service.updateRoomNameForUser(userId, roomId, newRoomName);
      expect(userRoomRepository.findOne).toHaveBeenCalledWith({
        where: { room: { id: roomId }, user: { id: userId } },
      });
      expect(userRoom.personalizedRoomName).toBe(newRoomName);
      expect(userRoomRepository.save).toHaveBeenCalledWith(userRoom);
    });
  });
});
