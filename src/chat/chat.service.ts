// src/chat/chat.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Room } from '../room/entities/room.entity';
import { Message } from './entities/message.entity';
import { UserRoom } from './entities/user-room.entity';
import { CreateChatDto } from './dto/create-chat.dto';
// import { UsersService } from '../users/users.service';
// import { RoomService } from '../room/room.service';
// import { AddUserToRoomDto } from '../room/dto/add-user-to-room.dto';
import { CreateRoomDto } from '../room/dto/create-room.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(UserRoom)
    private userRoomRepository: Repository<UserRoom>,
    // private userService: UsersService,
    // private roomService: RoomService,
    private dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(ChatService.name);

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const { name, usernames, isGroup } = createRoomDto;
    const users = await this.userRepository.find({
      where: { username: In(usernames) },
    });
    if (users.length !== usernames.length) {
      throw new Error('One or more users not found.');
    }

    const room = this.roomRepository.create({ name, isGroup });
    await this.roomRepository.save(room);

    for (const user of users) {
      const userRoom = this.userRoomRepository.create({
        room: room,
        user: user,
        joinedAt: new Date(),
      });
      await this.userRoomRepository.save(userRoom);
    }

    return room;
  }

  // async createRoomWithFriend(
  //   friendId: number,
  //   userId: number,
  // ): Promise<UserRoom> {
  //   const friend = await this.userService.findOneById(friendId);
  //   const user = await this.userService.findOneById(userId);
  //   if (!friend) {
  //     throw new NotFoundException('Friend not found');
  //   }
  //
  //   const createRoomDto: CreateRoomDto = {
  //     name: '',
  //     usernames: [],
  //     isGroup: false,
  //   };
  //
  //   const room = await this.roomService.createRoom(createRoomDto);
  //
  //   const addUserToRoomDto1: AddUserToRoomDto = {
  //     roomId: room.id,
  //     userId: user.id,
  //     personalizedRoomName: friend.username,
  //   };
  //   const addUserToRoomDto2: AddUserToRoomDto = {
  //     roomId: room.id,
  //     userId: friend.id,
  //     personalizedRoomName: user.username,
  //   };
  //
  //   await this.roomService.addUserToRoom(addUserToRoomDto1);
  //   await this.roomService.addUserToRoom(addUserToRoomDto2);
  //
  //   return this.userRoomRepository.findOne({
  //     where: { room: { id: room.id }, user: { id: user.id } },
  //   });
  // }

  async joinRoom(username: string, roomId: number): Promise<UserRoom> {
    const user = await this.userRepository.findOneBy({ username });
    const room = await this.roomRepository.findOneBy({ id: roomId });
    if (!user || !room) {
      throw new Error('User or room not found.');
    }

    const userRoom = await this.userRoomRepository.findOne({
      where: { user, room },
    });

    if (userRoom) {
      return userRoom; // The user is already a member of the room
    }

    const newUserRoom = this.userRoomRepository.create({
      user,
      room,
      joinedAt: new Date(),
    });

    return this.userRoomRepository.save(newUserRoom);
  }

  // async addUserToRoom(
  //   roomId: number,
  //   userId: number,
  //   personalizedRoomName?: string,
  // ): Promise<UserRoom> {
  //   const user = await this.userService.findOneById(userId);
  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }
  //
  //   const userRoom = this.userRoomRepository.create({
  //     room: { id: roomId },
  //     user,
  //     personalizedRoomName,
  //     joinedAt: new Date(),
  //   });
  //   return this.userRoomRepository.save(userRoom);
  // }

  // async sendMessage(
  //   userId: number,
  //   roomId: number,
  //   content: string,
  // ): Promise<Message> {
  //   const user = await this.userRepository.findOneBy({ userId });
  //   const room = await this.roomRepository.findOneBy({ roomId });
  //   if (!user || !room) {
  //     throw new Error('User or room not found.');
  //   }
  //
  //   const message = this.messageRepository.create({
  //     user: user,
  //     room: room,
  //     content: content,
  //     createdAt: new Date(),
  //   });
  //
  //   return this.messageRepository.save(message);
  // }

  async sendMessage(createChatDto: CreateChatDto): Promise<Message> {
    const { roomId, content, userId } = createChatDto;

    this.logger.log(
      `Attempting to send message: ${content} to room: ${roomId} by user: ${userId}`,
    );

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Check if content is empty
      if (!content || content.trim() === '') {
        this.logger.error('Message content cannot be empty');
        throw new Error('Message content cannot be empty');
      }

      // Check if user is in the room
      const userRoom = await transactionalEntityManager.findOne(UserRoom, {
        where: {
          room: { id: roomId },
          user: { id: userId },
        },
        relations: ['room', 'user'],
      });

      if (!userRoom) {
        this.logger.error(
          `Room not found or user not in room: roomId=${roomId}, userId=${userId}`,
        );
        throw new NotFoundException('Room not found or user not in room');
      }

      // Check if user exists
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId },
      });
      if (!user) {
        this.logger.error(`User not found: userId=${userId}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Creating message with content: ${content}`);

      // Create and save the message
      const message = transactionalEntityManager.create(Message, {
        content: content.trim(),
        room: { id: roomId },
        user: { id: userId },
        createdAt: new Date(),
      });

      const savedMessage = await transactionalEntityManager.save(
        Message,
        message,
      );
      this.logger.log(`Message saved successfully: ${savedMessage.id}`);

      return savedMessage;
    });
  }

  // async sendMessage(
  //   createChatDto: CreateChatDto,
  //   // userId: number,
  // ): Promise<Message> {
  //   console.log(`sendMessage in chat service`);
  //   const { roomId, content, userId } = createChatDto;
  //   // console.log(`${createChatDto}`);
  //   this.logger.log(`Attempting to send message: ${content} to room: ${roomId} by user: ${userId}`);
  //
  //   if (!content) {
  //     this.logger.error('Message content cannot be empty');
  //     throw new Error('Message content cannot be empty');
  //   }
  //   this.logger.log(
  //     `Sending message: ${content} to room: ${roomId} by user: ${userId}`,
  //   );
  //
  //   const userRoom = await this.userRoomRepository.findOne({
  //     where: {
  //       room: { id: roomId },
  //       user: { id: userId },
  //     },
  //     relations: ['room', 'user'],
  //   });
  //   if (!userRoom) {
  //     this.logger.error(
  //       `Room not found or user not in room: roomId=${roomId}, userId=${userId}`,
  //     );
  //     throw new NotFoundException('Room not found or user not in room');
  //   }
  //
  //   const user = await this.userRepository.findOne({ where: { id: userId } });
  //   if (!user) {
  //     this.logger.error(`User not found: userId=${userId}`);
  //     throw new NotFoundException('User not found');
  //   }
  //   console.log(`find user for message ${user}`);
  //   const message = this.messageRepository.create({
  //     content,
  //     room: { id: roomId }, //
  //     user: { id: userId }, //
  //     createdAt: new Date(),
  //   });
  //
  //   console.log(`Creating message with content: ${content}`);
  //
  //   return this.messageRepository.save(message);
  // }

  async getChatLogs(roomId: number, userId: number): Promise<Message[]> {
    const userRoom = await this.userRoomRepository.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });
    if (!userRoom) {
      throw new NotFoundException('Room not found or user not in room');
    }

    return this.messageRepository.find({
      where: { room: { id: roomId } },
      order: { createdAt: 'ASC' },
      relations: ['user', 'room'], //
    });
  }

  async findRoomsByUserId(userId: number): Promise<Room[]> {
    return this.roomRepository
      .createQueryBuilder('room')
      .innerJoinAndSelect(
        'room.userRooms',
        'userRoom',
        'userRoom.user.id = :userId',
        { userId },
      )
      .getMany();
  }

  //   async findRoomsByUserId(userId: number): Promise<Room[]> {
  //     return this.roomRepository
  //       .createQueryBuilder('room')
  //       .innerJoinAndSelect('room.users', 'user', 'user.id = :userId', { userId })
  //       .getMany();
  //   }

  async updateRoomNameForUser(
    userId: number,
    roomId: number,
    newRoomName: string,
  ): Promise<void> {
    const userRoom = await this.userRoomRepository.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });
    if (!userRoom) {
      throw new NotFoundException('Room not found or user not in room');
    }

    userRoom.personalizedRoomName = newRoomName;
    await this.userRoomRepository.save(userRoom);
  }
}
