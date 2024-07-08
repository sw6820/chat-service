import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { Room } from './entities/room.entity';
import { RoomService } from './room.service';
import { User } from '../users/entities/user.entity';
import { UserRoom } from '../chat/entities/user-room.entity';
import { UsersModule } from '../users/users.module';
import { Message } from '../chat/entities/message.entity';
import { RoomController } from './room.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room, User, UserRoom, Message]),
    UsersModule,
  ],
  providers: [Room, RoomService],
  exports: [RoomService, TypeOrmModule],
  controllers: [RoomController],
})
export class RoomModule {}
