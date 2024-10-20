import { forwardRef, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // const jwtSecret = configService.get<string>('JWT_SECRET');
        // console.log('Loaded JWT_SECRET in AuthModule:', jwtSecret); // Debugging JWT_SECRET
        // return {
        //   secret: `a`, //jwtSecret,
        //   signOptions: { expiresIn: '7d' },
        // secret: 'YOUR_HARDCODED_SECRET_FOR_TESTING', // `${configService.get<string>('JWT_SECRET')}`,
        // signOptions: { expiresIn: '1h' },
        // algorithm: 'HS256',
        console.log(
          `Loading environment from: ${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
        );

        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret: secret,
          signOptions: { expiresIn: '1h' },
        };
      },
      inject: [ConfigService],
    }),
    // UsersModule,
    forwardRef(() => UsersModule),
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
    }),
  ],
  providers: [
    AuthService,
    LocalStrategy,
    GithubStrategy,
    JwtStrategy,
    GoogleStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService, PassportModule],
})
export class AuthModule {}
