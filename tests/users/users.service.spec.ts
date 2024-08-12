import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

const mockUserRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<MockRepository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      const user = { id: 1, ...createUserDto };

      userRepository.create.mockReturnValue(user);
      userRepository.save.mockResolvedValue(user);

      const result = await service.create(createUserDto);
      expect(result).toEqual(user);
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(user);
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneByEmail('tests@example.com');
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'tests@example.com' },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.findOneByEmail('tests@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',

        friends: [],
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOneById(1);
      expect(result).toEqual(user);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['friends'],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneById(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [
        {
          id: 1,
          username: 'testuser1',
          email: 'test1@example.com',
          password: 'password',
        },
        {
          id: 2,
          username: 'testuser2',
          email: 'test2@example.com',
          password: 'password',
        },
      ];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();
      expect(result).toEqual(users);
      expect(userRepository.find).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update the user details', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      userRepository.findOne.mockResolvedValue(user);

      const updateUserDto = {
        username: 'updateduser',
        password: 'newpassword',
      };
      const updatedUser = { ...user, ...updateUserDto };

      userRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('tests@example.com', updateUserDto);
      expect(result).toEqual(updatedUser);
      expect(userRepository.save).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const updateUserDto = {
        username: 'updateduser',
        password: 'newpassword',
      };

      await expect(
        service.update('tests@example.com', updateUserDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the user', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
      };
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.remove('tests@example.com');
      expect(result).toBeUndefined();
      expect(userRepository.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('tests@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
  describe('addFriend', () => {
    it('should add a friend to the user', async () => {
      const userId = 1;
      const friendEmail = 'friend@example.com';
      const user = {
        id: userId,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
        friends: [],
      };
      const friend = {
        id: 2,
        email: friendEmail,
        username: 'friend',
      };

      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.findOne.mockResolvedValueOnce(friend);
      userRepository.save.mockResolvedValue({
        ...user,
        friends: [
          { id: friend.id, email: friend.email, username: friend.username },
        ],
      });

      const result = await service.addFriend(userId, friendEmail);
      expect(result.friends).toEqual([
        { id: friend.id, email: friend.email, username: friend.username },
      ]);
      expect(userRepository.save).toHaveBeenCalledWith({
        ...user,
        friends: [
          { id: friend.id, email: friend.email, username: friend.username },
        ],
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.addFriend(1, 'friend@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if friend not found', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
        friends: [],
      };

      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.addFriend(1, 'friend@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw an error if they are already friends', async () => {
      const userId = 1;
      const friendEmail = 'friend@example.com';
      const user = {
        id: userId,
        username: 'testuser',
        email: 'tests@example.com',
        password: 'password',
        friends: [{ id: 2, email: friendEmail, username: 'friend' }],
      };

      const friend = {
        id: 2,
        email: friendEmail,
        username: 'friend',
      };

      userRepository.findOne.mockResolvedValueOnce(user);
      userRepository.findOne.mockResolvedValueOnce(friend);

      await expect(service.addFriend(userId, friendEmail)).rejects.toThrow(
        'User is already friends with this person',
      );
    });
  });
});
