import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
// import { error } from 'winston';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    this.logger.log(`JWT_SECRET length: ${jwtSecret ? jwtSecret.length : 0}`);
    this.logger.log(
      `JWT_SECRET first 5 chars: ${jwtSecret ? jwtSecret.substring(0, 5) : 'N/A'}`,
    );
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findOneByEmail(email);
    if (!user) {
      console.log(`User ${email} not found`);
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
      console.log(`found user: ${JSON.stringify(user)}`);
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

  async register(
    userDto: CreateUserDto,
  ): Promise<{ user: Omit<User, 'password'>; access_token: string }> {
    const existingUser = await this.userService.findOneByEmail(userDto.email);
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

    const user = this.omitPassword(newUser);
    const access_token = await this.generateToken(user);

    return { user, access_token };
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password, ...userInfo } = user;
    return userInfo;
  }

  // Generate JWT token
  async generateToken(user: Omit<User, 'password'>): Promise<string> {
    try {
      this.logger.log('Generating token');

      // Create the JWT payload
      const payload = {
        sub: user.id,
        username: user.username,
        email: user.email,
      };
      this.logger.log(`JWT Payload: ${JSON.stringify(payload)}`);

      // Ensure we have a secret key
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET is not defined');
      }
      this.logger.log(`JWT_SECRET length before signing: ${secret.length}`);

      const token = await this.jwtService.signAsync(payload, {
        secret: secret,
        expiresIn: '7d',
        algorithm: 'HS256',
        issuer: 'chat-service',
        audience: ['chat-service-api'],
        notBefore: 0,
      });

      this.logger.log('JWT token generated successfully');
      return token;
    } catch (error) {
      this.logger.error(
        `Error generating JWT token: ${error.message}`,
        error.stack,
      );
      throw new UnauthorizedException('Failed to generate JWT token');
    }
  }

  // Login method to validate user and generate token
  async login(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    try {
      this.logger.log(`Generating token for user: ${email}`);
      const user = await this.validateUser(email, password);
      console.log(`auth service login`);
      console.log(`validate user ${JSON.stringify(user)}`);
      this.logger.log(`User validated: ${JSON.stringify(user)}`);
      const access_token = await this.generateToken(user);
      this.logger.log(`Token generated successfully`);
      console.log(`generate token ${access_token}`);
      console.log('Access Token:', access_token); // Debugging Access Token after login
      return { access_token };
    } catch (error) {
      // Log error details
      // console.error('Login failed:', error.message);
      this.logger.error(
        `Error generating JWT token: ${error.message}`,
        error.stack,
      );
      this.logger.error(
        `JWT Secret length: ${this.configService.get<string>('JWT_SECRET')?.length || 0}`,
      );
      throw new UnauthorizedException('Failed to generate JWT token');
      // throw error;

      // Check for specific errors and rethrow them with appropriate HTTP status codes
      if (error.message.includes('Invalid email or password')) {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
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
}
