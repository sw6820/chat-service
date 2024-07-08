import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    // console.log(`user: ${JSON.stringify(user)}`);
    const { password: hashedPassword, ...userInfo } = user;
    // console.log(hashedPassword, password);
    const isPasswordValid = await this.validatePassword(
      password,
      hashedPassword,
    );
    if (isPasswordValid) {
      return userInfo;
    }
    throw new HttpException(
      'Invalid email or password',
      HttpStatus.UNAUTHORIZED,
    );
  }

  async validatePassword(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, hashedPassword);
  }

  async register(userDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // console.log(`registering ${JSON.stringify(userDto)}`);
    const existingUser = await this.userService.findOneByEmail(userDto.email);
    // console.log(`found ${existingUser}`);
    if (existingUser) {
      throw new HttpException(
        'User with this email already exists.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(userDto.password, 10);
    const newUser = await this.userService.create({
      ...userDto,
      password: hashedPassword,
    });
    return this.omitPassword(newUser);
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password, ...userInfo } = user;
    return userInfo;
  }

  async login(user: User): Promise<{ access_token: string }> {
    const payload = { sub: user.id };
    return {
      //
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateGithubUser(profile: any): Promise<any> {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new HttpException(
        'GitHub account does not have an email',
        HttpStatus.BAD_REQUEST,
      );
    }

    let user = await this.userService.findOneByEmail(email);
    if (!user) {
      user = await this.userService.create({
        email,
        username: profile.username,
      });
    }
    return this.omitPassword(user);
  }

  async validateOAuthUser(
    profile: any,
  ): Promise<Omit<User, 'password'> | null> {
    const email = profile.email;
    let user = await this.userService.findOneByEmail(email);
    if (!user) {
      user = await this.userService.create({
        email,
        username: profile.firstName + ' ' + profile.lastName,
      });
    }
    return this.omitPassword(user);
  }

  generateToken(user: Omit<User, 'password'>) {
    const payload = {
      username: user.username,
      sub: user.id,
      email: user.email,
    };
    return this.jwtService.sign(payload);
  }
}
