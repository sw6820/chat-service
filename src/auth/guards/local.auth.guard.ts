import {
  CanActivate,
  ExecutionContext,
  Injectable,
  // UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

// @Injectable()
// export class LoginGuard implements CanActivate {
//   constructor(private authService: AuthService) {}
//
//   async canActivate(context: any): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const response = context.switchToHttp().getResponse();
//
//     if (request.cookies['login']) {
//       console.log('has cookie');
//       console.log(`login cookie: ${request.cookies['login']}`);
//       return true;
//     }
//
//     if (!request.body.email || !request.body.password) {
//       return false;
//     }
//     const user = await this.authService.validateUser(
//       request.body.email,
//       request.body.password,
//     );
//
//     if (!user) {
//       return false;
//     }
//     request.user = user;
//     console.log(`login user ${request.user}`);
//     // request.cookie('login', user.email, { httpOnly: true });
//     // request.cookie('email', user.email);
//     response.cookie('login', JSON.stringify(user), {
//       httpOnly: true,
//       maxAge: 1000 * 60 * 60 * 24 * 7,
//     }); // 7 days
//     return true;
//   }
// }

@Injectable()
export class LoginSessionGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // const response = context.switchToHttp().getResponse();

    if (request.session.user) {
      console.log(`Session user ${request.session.user}`);
      return true;
    }

    const { email, password } = request.body;
    if (!email || !password) {
      return false;
    }

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      return false;
    }

    request.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
    };
    console.log(`Login User : ${JSON.stringify(request.session.user)}`);
    return true;
  }
}

@Injectable()
export class AuthenticatedSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log(`auth session req : ${JSON.stringify(request.session)}`);
    console.log(`auth session user : ${JSON.stringify(request.session.user)}`);
    return !!request.session.user;
  }
}

// @Injectable()
// export class LoginGuard implements CanActivate {
//   constructor(private authService: AuthService) {}
//
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();
//     const response = context.switchToHttp().getResponse();
//
//     const { email, password } = request.body;
//     if (!email || !password) {
//       throw new UnauthorizedException('Missing email or password');
//     }
//
//     const user = await this.authService.validateUser(email, password);
//     if (!user) {
//       throw new UnauthorizedException('Invalid credentials');
//     }
//
//     const token = this.authService.generateToken(user);
//     response.json({ user, token });
//
//     return false; // Return false to prevent further execution since response is already sent
//   }
// }

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {}
//
// @Injectable()
// export class LocalAuthGuard extends AuthGuard('local') {
//   async canActivate(context: any): Promise<boolean> {
//     console.log(`start local auth guard`);
//     const result = (await super.canActivate(context)) as boolean;
//     const request = context.switchToHttp().getRequest();
//     await super.logIn(request);
//     console.log(`local auth guard req: ${JSON.stringify(request)}`);
//     return result;
//   }
// }

// @Injectable()
// export class AuthenticatedGuard implements CanActivate {
//   // constructor(private authService: AuthService) {}
//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//
//     const loginInfo = request.cookies['login'];
//     // console.log(`loginInfo: ${loginInfo}`);
//     if (loginInfo) {
//       // console.log(`loginInfo: ${loginInfo}`);
//       try {
//         const parsedLoginInfo = JSON.parse(loginInfo);
//         // console
//         // const email = parsedLoginInfo.email;
//         // console.log(`email: ${email}`);
//         const { id, username, email } = parsedLoginInfo;
//
//         if (id && username && email) {
//           const { id, username, email } = parsedLoginInfo;
//           request.user = { id, username, email }; // Attach email to request.user
//           return true;
//         }
//       } catch (e) {
//         console.error('Error parsing login cookie:', e);
//         return false;
//       }
//     }
//     return false;
//   }
// }

// @Injectable()
// export class GoogleAuthGuard extends AuthGuard('google') {
//   async canActivate(context: any): Promise<boolean> {
//     const result = (await super.canActivate(context)) as boolean;
//     const request = context.switchToHttp().getRequest();
//     await super.logIn(request);
//     return result;
//   }
// }

// @Injectable()
// export class TestGuard implements CanActivate {
//   canActivate(context: ExecutionContext): boolean {
//     const request = context.switchToHttp().getRequest();
//   }
// }
