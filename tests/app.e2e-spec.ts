// import { Test, TestingModule } from '@nestjs/testing';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import * as request from 'supertest';
// import { AppModule } from '../src/app.module';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { User } from '../src/users/entities/user.entity';
// import { Repository } from 'typeorm';
// import * as bcrypt from 'bcryptjs';
//
// describe('AppController (e2e)', () => {
//   let app: INestApplication;
//   let userRepository: Repository<User>;
//
//   beforeAll(async () => {
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [AppModule],
//     }).compile();
//
//     app = moduleFixture.createNestApplication();
//     app.useGlobalPipes(new ValidationPipe());
//     await app.init();
//
//     userRepository = moduleFixture.get<Repository<User>>(
//       getRepositoryToken(User),
//     );
//   });
//
//   afterAll(async () => {
//     await app.close();
//   });
//
//   beforeEach(async () => {
//     await userRepository.query('TRUNCATE TABLE "user" CASCADE');
//   });
//
//   describe('/auth/signup (POST)', () => {
//     it('should register a new user', async () => {
//       const createUserDto = {
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password',
//       };
//
//       const response = await request(app.getHttpServer())
//         .post('/auth/signup')
//         .send(createUserDto)
//         .expect(201);
//
//       expect(response.body).toEqual({
//         message: 'User registered successfully',
//         user: expect.objectContaining({
//           id: expect.any(Number),
//           username: createUserDto.username,
//           email: createUserDto.email,
//           createdAt: expect.any(String),
//           updatedAt: expect.any(String),
//         }),
//       });
//     });
//
//     it('should return 400 if the user already exists', async () => {
//       const createUserDto = {
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password',
//       };
//
//       const user = userRepository.create({
//         ...createUserDto,
//         password: await bcrypt.hash(createUserDto.password, 10),
//       });
//       await userRepository.save(user);
//
//       const response = await request(app.getHttpServer())
//         .post('/auth/signup')
//         .send(createUserDto)
//         .expect(400);
//
//       expect(response.body.message).toEqual(
//         'User with this email already exists.',
//       );
//     });
//   });
//
//   describe('/auth/login (POST)', () => {
//     it('should log in a user and set a cookie', async () => {
//       const createUserDto = {
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password',
//       };
//
//       const user = userRepository.create({
//         ...createUserDto,
//         password: await bcrypt.hash(createUserDto.password, 10),
//       });
//       await userRepository.save(user);
//
//       const response = await request(app.getHttpServer())
//         .post('/auth/login')
//         .send({
//           email: createUserDto.email,
//           password: createUserDto.password,
//         })
//         .expect(200);
//
//       expect(response.body).toEqual({
//         message: 'Login successful',
//         user: expect.objectContaining({
//           id: user.id,
//           username: user.username,
//           email: user.email,
//           createdAt: expect.any(String),
//           updatedAt: expect.any(String),
//         }),
//       });
//
//       expect(response.headers['set-cookie']).toBeDefined();
//     });
//
//     it('should return 401 if login credentials are invalid', async () => {
//       const createUserDto = {
//         username: 'testuser',
//         email: 'test@example.com',
//         password: 'password',
//       };
//
//       const response = await request(app.getHttpServer())
//         .post('/auth/login')
//         .send({
//           email: createUserDto.email,
//           password: 'wrongpassword',
//         })
//         .expect(401);
//
//       expect(response.body.message).toEqual('Invalid email or password');
//     });
//   });
// });
