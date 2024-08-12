import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { Response } from 'express';
import { User } from '../../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpException, HttpStatus } from '@nestjs/common';
jest.mock('bcryptjs');
const hashedPassword =
  '$2a$10$6D9qyX7T3vc7k1M2kd4gzOhzDVMQPDGam6x1P30tYOhZXIGIo8rd6';
describe('AppController', () => {
  let authController: AuthController;
  let authService: AuthService;
  // let usersService: UsersService;
  // let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            validateUser: jest.fn(),
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

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    // usersService = module.get<UsersService>(UsersService);
    // jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should call AuthService.register and return its result', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };

      const result: User = {
        id: 1,
        password: hashedPassword,
        ...createUserDto,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      };
      jest.spyOn(authService, 'register').mockResolvedValue(result);
      const response = await authController.register(createUserDto);
      expect(response).toEqual({
        message: 'User registered successfully',
        user: result,
      });
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should set a cookie and return a success message', async () => {
      const req = {
        body: {
          email: 'tests@example.com',
          password: 'password',
        },
        session: {},
      } as any;
      const res = {
        send: jest.fn(),
      } as any as Response;

      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        userRooms: [],
        friends: [],
      };

      const userInfo = {
        id: user.id,
        username: user.username,
        email: user.email,
        // password: user.password,
      };

      jest.spyOn(authService, 'validateUser').mockResolvedValue(user);

      await authController.login(req.body, req, res);

      expect(req.session.user).toEqual(userInfo);
      expect(res.send).toHaveBeenCalledWith({
        message: 'Login successful',
        user: req.session.user,
      });
    });

    it('should not set a cookie if validation fails', async () => {
      const req = {
        body: {
          email: 'tests@example.com',
          password: 'password',
        },
        session: {},
      } as any;

      const res = {
        send: jest.fn(),
      } as any as Response;

      jest.spyOn(authService, 'validateUser').mockResolvedValue(null);

      // await authController.login(req, res);
      //
      await expect(authController.login(req.body, req, res)).rejects.toThrow(
        new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED),
      );
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the session and return a success message', async () => {
      const req = {
        session: {
          destroy: jest.fn((callback) => callback(null)),
        },
      } as any;
      const res = {
        clearCookie: jest.fn(),
        send: jest.fn(),
      } as any as Response;

      await authController.logout(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('connect.sid');
      expect(res.send).toHaveBeenCalledWith({ message: 'Logout successful' });
    });

    it('should return a 500 error if session destruction fails', async () => {
      const req = {
        session: {
          destroy: jest.fn((callback) => callback(new Error('Logout failed'))),
        },
      } as any;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as any as Response;

      await authController.logout(req, res);

      expect(req.session.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Logout failed');
    });
  });

  describe('checkSession', () => {
    it('should return the user if session is active', async () => {
      const req = {
        session: {
          user: {
            id: 1,
            username: 'testuser',
            email: 'tests@example.com',
          },
        },
      } as any;
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any as Response;

      await authController.checkSession(req, res);

      expect(res.send).toHaveBeenCalledWith({ user: req.session.user });
    });

    it('should return a 401 error if no active session', async () => {
      const req = {
        session: {},
      } as any;
      const res = {
        send: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any as Response;

      await authController.checkSession(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('No active session');
    });
  });
});
