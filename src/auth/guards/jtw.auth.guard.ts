// src/auth/guards/jwt.auth.guard.ts
import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Add some logging here
    // console.log('JwtAuthGuard: Checking authentication');
    // console.log(`context : ${JSON.stringify(context)}`);
    // console.log(`context: ${Object.keys(context)}`);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Add some logging here
    // console.log('JwtAuthGuard: ~Handling request', { error: err, user, info });

    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
