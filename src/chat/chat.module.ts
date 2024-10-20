import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { Room } from '../room/entities/room.entity';
import { User } from '../users/entities/user.entity';
import { Message } from './entities/message.entity';
import { UserRoom } from './entities/user-room.entity';
import { UsersModule } from '../users/users.module';
import { ChatGateway } from './gateways/chat.gateway';
import { RoomService } from '../room/room.service';
import { RoomModule } from '../room/room.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Room, User, UserRoom]),
    JwtModule.registerAsync({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
        }),
      ],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: `${configService.get<string>('JWT_SECRET')}`,
      }),
    }),
    UsersModule,
    RoomModule,
    // PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [ChatService, ChatGateway, RoomService],
  exports: [ChatService],
})
export class ChatModule {}
