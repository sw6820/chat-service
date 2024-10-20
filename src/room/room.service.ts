import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { UserRoom } from '../chat/entities/user-room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { AddUserToRoomDto } from './dto/add-user-to-room.dto';

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRoom)
    private userRoomRepository: Repository<UserRoom>,
    private userService: UsersService,
  ) {}

  async findOrCreateRoom(userId: number, friendId: number): Promise<Room> {
    this.logger.log(
      `Finding or creating room for users: ${userId} and ${friendId}`,
    );

    try {
      let room = await this.roomRepository
        .createQueryBuilder('room')
        .innerJoin(
          'room.userRooms',
          'userRoom1',
          'userRoom1.userId = :userId',
          {
            userId,
          },
        )
        .innerJoin(
          'room.userRooms',
          'userRoom2',
          'userRoom2.userId = :friendId',
          { friendId },
        )
        .getOne();

      if (!room) {
        this.logger.log('Room not found, creating a new one');
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });
        const friend = await this.userRepository.findOne({
          where: { id: friendId },
        });

        if (!user || !friend) {
          throw new NotFoundException('User or friend not found');
        }

        room = this.roomRepository.create({
          name: `${user.username}-${friend.username}`,
          isGroup: false,
        });
        room = await this.roomRepository.save(room);

        await this.addUserToRoom({ roomId: room.id, userId: user.id });
        await this.addUserToRoom({ roomId: room.id, userId: friend.id });
      }

      return room;
    } catch (error) {
      this.logger.error(
        `Error in findOrCreateRoom: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
  }

  async joinRoom(roomId: number, joinRoomDto: JoinRoomDto): Promise<Room> {
    const { username } = joinRoomDto;
    const user = await this.userRepository.findOne({ where: { username } });
    console.log(`To join a room with ${username}`);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['userRooms', 'userRooms.user'],
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const existingUserRoom = room.userRooms.find(
      (userRoom) => userRoom.user.id === user.id,
    );
    if (!existingUserRoom) {
      await this._addUserToRoom(roomId, user.id);
    }

    return room;
  }

  async addUserToRoom(addUserToRoomDto: AddUserToRoomDto): Promise<UserRoom> {
    const { roomId, userId, personalizedRoomName } = addUserToRoomDto;
    return this._addUserToRoom(roomId, userId, personalizedRoomName);
  }

  private async _addUserToRoom(
    roomId: number,
    userId: number,
    personalizedRoomName?: string,
  ): Promise<UserRoom> {
    const user = await this.userService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const userRoom = this.userRoomRepository.create({
      room: { id: roomId },
      user,
      personalizedRoomName: personalizedRoomName || room.name,
      joinedAt: new Date(),
    });
    return this.userRoomRepository.save(userRoom);
  }

  async removeUserFromRoom(roomId: number, userId: number): Promise<void> {
    const userRoom = await this.userRoomRepository.findOne({
      where: { room: { id: roomId }, user: { id: userId } },
    });
    if (!userRoom) {
      throw new NotFoundException('User not in room');
    }

    await this.userRoomRepository.remove(userRoom);
  }
}
