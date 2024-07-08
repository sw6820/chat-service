import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    const newUser = this.userRepository.create(createUserDto);
    return this.userRepository.save(newUser);
  }

  async findOneById(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['friends'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    // console.log(`findOneByEmail ${email}`);
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // console.log(`User with email ${email} not found`);
      return null;
    }
    // console.log(`user: ${user}`);
    return user;
  }

  async findOneByEmailSecure(email: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'username', 'createdAt', 'updatedAt'], // Exclude 'password'
    });
    if (!user) {
      // console.log(`User with email ${email} not found`);
      return null;
    }
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async update(email: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.password !== undefined) {
      user.password = updateUserDto.password;
    }

    return this.userRepository.save(user);
  }

  async remove(email: string): Promise<void> {
    const user = await this.findOneByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    await this.userRepository.remove(user);
  }

  async addFriend(userId: number, friendEmail: string): Promise<User> {
    // console.log(`friend email : ${friendEmail}`);
    const user = await this.findOneById(userId);
    const friend = await this.findOneByEmailSecure(friendEmail);
    // console.log(`add new friend ${JSON.stringify(friend)}`);

    if (!user) {
      throw new NotFoundException(`User with email ${userId} not found`);
    }

    if (!friend) {
      throw new NotFoundException(`Friend with email ${friendEmail} not found`);
    }

    if (!user.friends) {
      user.friends = [];
    }

    if (user.friends.some((f) => f.id === friend.id)) {
      throw new Error('User is already friends with this person');
    }

    user.friends.push({
      id: friend.id,
      email: friend.email,
      username: friend.username,
    });
    // console.log(`friend: ${JSON.stringify(user.friends)}`);
    return this.userRepository.save(user);
  }

  // async getFriends(userId: number): Promise<User[]> {
  //   const user = await this.findOneById(userId);
  //   return user.friends;
  // }
}
