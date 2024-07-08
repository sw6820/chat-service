import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Message } from '../../chat/entities/message.entity';
import { UserRoom } from '../../chat/entities/user-room.entity';
import { IsEmail, Length } from 'class-validator';

@Entity()
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  password: string;

  @Column({ unique: true })
  @Length(4, 20)
  username: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  @ManyToMany(() => User, { cascade: true })
  @JoinTable()
  friends: Partial<User>[];

  // @Column({ default: true })
  // isActive: boolean;
}
