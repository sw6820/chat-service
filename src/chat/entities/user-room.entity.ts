import { Room } from '../../room/entities/room.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class UserRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  joinedAt: Date;

  @ManyToOne(() => User, (user) => user.userRooms)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Room, (room) => room.userRooms)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @Column({ nullable: true })
  personalizedRoomName: string;

  // @Column({ nullable: true })
  // customRoomName: string; // Optional custom name for the room by the user

  // @ManyToOne(() => User, user => user.userRooms)
  // @JoinColumn({ name: 'userId' })
  // user: User;
  //
  // @Column()
  // userId: number;
  //
  // @ManyToOne(() => Room, room => room.userRooms)
  // @JoinColumn({ name: 'roomId' })
  // room: Room;
  //
  // @Column()
  // roomId: number;
}
