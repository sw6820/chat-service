import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secretOrKey = configService.get<string>('JWT_SECRET');  
    if (!secretOrKey) {
      throw new Error('JWT_SECRET is not defined in the environment variables');
    }
    console.log('Loaded JWT_SECRET in JwtStrategy:', secretOrKey);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretOrKey,
    });
    console.log(
      'JwtStrategy initialized with secret length:',
      configService.get<string>('JWT_SECRET')?.length || 0,
    );
  }

  async validate(payload: any) {
    console.log(`validating jwt strategy with payload:`, payload); // Log payload for debugging
    if (!payload) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const user = await this.usersService.findOneById(payload.sub);
    if (!user) {
      console.error(`User not found for ID: ${payload.sub}`); // Log user not found
      throw new UnauthorizedException();
    }
    console.log(`User validated: ${JSON.stringify(user)}`);
    return {
      userId: payload.sub,
      username: payload.username,
      email: payload.email,
    };
  }
}
