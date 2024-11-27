import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { User } from '../../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
// import { AuthController } from '../../src/auth/auth.controller';
import { HttpException, HttpStatus } from '@nestjs/common';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findOneByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      const hashedPassword =
        '$2a$10$6D9qyX7T3vc7k1M2kd4gzOhzDVMQPDGam6x1P30tYOhZXIGIo8rd6';
      const result: User = {
        id: 1,
        ...createUserDto,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      jest.spyOn(usersService, 'create').mockResolvedValue(result);
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      const newUser = await service.register(createUserDto);

      expect(newUser).toEqual({
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        messages: [],
        userRooms: [],
        friends: [],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
    });
    // expect(newUser).toBe(result);
    // expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    // expect(usersService.create).toHaveBeenCalledWith({
    //   ...createUserDto,
    //   password: hashedPassword,
    // });

    //   const response = await authController.register(userDto);
    //   expect(response).toEqual({
    //     message: 'User registered successfully',
    //     user: result,
    //   });
    //   expect(authService.register).toHaveBeenCalledWith(userDto);
    // });
    // });

    it('should throw an error if the user already exists', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      // jest.spyOn(usersService, 'create').mockImplementation(() => {
      //   throw new Error('User already exists');
      // });
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue({
        ...createUserDto,
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      } as User);

      // await expect(service.register(createUserDto)).rejects.toThrow(
      //   'User already exists',
      // );
      // await expect(service.register(createUserDto)).rejects.toThrow(
      //   'User with this email already exists.',
      // );
      await expect(service.register(createUserDto)).rejects.toThrow(
        new HttpException(
          'User with this email already exists.',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if validation is successful', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      };
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(user);
      jest.spyOn(service, 'validatePassword').mockResolvedValue(true);

      const result = await service.validateUser(
        'tests@example.com',
        'password',
      );
      const { password, ...expectedUser } = user;
      expect(result).toEqual(expectedUser);
    });

    it('should return null if validation fails', async () => {
      jest.spyOn(usersService, 'findOneByEmail').mockResolvedValue(null);

      await expect(
        service.validateUser('tests@example.com', 'password'),
      ).rejects.toThrow(
        new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED),
      );
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      };
      const token = 'testtoken';
      jest.spyOn(jwtService, 'sign').mockReturnValue(token);

      const result = await service.login(user.email, user.password);
      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id });
    });
  });
});
