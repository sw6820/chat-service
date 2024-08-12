import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';
import { User } from '../../src/users/entities/user.entity';
import { AuthenticatedSessionGuard } from '../../src/auth/guards/local.auth.guard';
describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findAll: jest.fn(),
    findOneById: jest.fn(),
    addFriend: jest.fn(),
    findOneByEmailSecure: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    })
      .overrideGuard(AuthenticatedSessionGuard)
      .useValue({
        canActivate: jest.fn((context) => {
          const request = context.switchToHttp().getRequest();
          request.session = { user: { id: 1 } }; // Mocked user ID
          return true;
        }),
      })
      .compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
      };
      const user = { id: 1, ...createUserDto };

      mockUsersService.create.mockResolvedValue(user);

      const result = await usersController.create(createUserDto);
      expect(result).toEqual(user);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('findOne', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const user = { id: 1, username: 'testuser', email, password: 'password' };

      mockUsersService.findOneByEmail.mockResolvedValue(user);

      const result = await usersController.findOne(email);
      expect(result).toEqual(user);
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
    });
  });

  describe('update', () => {
    it('should update a user by email', async () => {
      const email = 'test@example.com';
      const updateUserDto: UpdateUserDto = {
        username: 'updateduser',
        password: 'newpassword',
      };
      const updatedUser = { id: 1, email, ...updateUserDto };

      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await usersController.update(email, updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.update).toHaveBeenCalledWith(
        email,
        updateUserDto,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user by email', async () => {
      const email = 'test@example.com';

      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await usersController.remove(email);
      expect(result).toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(email);
    });
  });
  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          password: 'password',
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          password: 'password',
        },
      ];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await usersController.findAll();
      expect(result).toEqual(users);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return the user profile', async () => {
      const user = { id: 1, email: 'test@example.com', username: 'testuser' };
      mockUsersService.findOneById.mockResolvedValue(user);

      const req = { session: { user: { id: 1 } } };
      const result = await usersController.getProfile(req);
      expect(result).toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
      });
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(1);
    });
  });

  describe('addFriend', () => {
    it('should add a friend to the user', async () => {
      const userId = 1;
      const friendEmail = 'friend@example.com';
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        friends: [],
      };
      const friend = { id: 2, email: friendEmail, username: 'friend' };
      const updatedUser = { ...user, friends: [friend] };

      mockUsersService.addFriend.mockResolvedValue(updatedUser);

      const req = { session: { user: { id: 1 } } };
      const result = await usersController.addFriend(req, friendEmail);
      expect(result).toEqual(updatedUser);
      expect(mockUsersService.addFriend).toHaveBeenCalledWith(
        userId,
        friendEmail,
      );
    });
  });

  describe('findOneSecure', () => {
    it('should return a user by email without password', async () => {
      const email = 'test@example.com';
      const user = { id: 1, username: 'testuser', email };

      mockUsersService.findOneByEmailSecure.mockResolvedValue(user);

      const result = await usersController.findOneSecure(email);
      expect(result).toEqual(user);
      expect(mockUsersService.findOneByEmailSecure).toHaveBeenCalledWith(email);
    });
  });

  describe('getFriends', () => {
    it("should return the user's friends", async () => {
      const userId = 1;
      const user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        friends: [{ id: 2, email: 'friend@example.com', username: 'friend' }],
      };
      const friend = { id: 2, email: 'friend@example.com', username: 'friend' };
      const secureFriend = {
        id: friend.id,
        email: friend.email,
        username: friend.username,
      };

      mockUsersService.findOneById.mockResolvedValue(user);
      mockUsersService.findOneByEmailSecure.mockResolvedValue(secureFriend);

      const req = { session: { user: { id: 1 } } };
      const result = await usersController.getFriends(req);
      expect(result).toEqual({ friends: [secureFriend] });
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(userId);
      expect(mockUsersService.findOneByEmailSecure).toHaveBeenCalledWith(
        friend.email,
      );
    });
  });
});
