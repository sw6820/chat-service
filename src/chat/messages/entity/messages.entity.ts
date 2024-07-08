// import { IsString } from 'class-validator';
// import { ChatsModel } from 'src/chats/entity/chats.entity';
// import { BaseModel } from 'src/common/entity/base.entity';
// import { User } from 'src/users/user.entity';
// import { Column, Entity, ManyToOne } from 'typeorm';
//
// @Entity()
// export class MessagesModel extends BaseModel {
//   @ManyToOne(() => ChatsModel, (chat) => chat.messages)
//   chat: ChatsModel;
//
//   @ManyToOne(() => User, (user) => user.messages)
//   author: User;
//
//   @Column()
//   @IsString()
//   message: string;
// }

// src/chat/messages/entity/messages.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Room } from '../../../room/entities/room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  content: string;

  // @Column()
  // roomId: number;

  // @Column()
  // userId: number;

  @ManyToOne(() => User, (user) => user.messages)
  user: User;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;
}
