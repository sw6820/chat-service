// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Req,
  // Request,
  Res,
  // Response,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthenticatedSessionGuard,
  // GoogleAuthGuard,
  // LocalAuthGuard,
  LoginSessionGuard,
} from './guards/local.auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
// import { GithubAuthGuard } from './guards/github.auth.guard';
import { LoginDto } from './dto/login.dto';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

// import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async register(@Body() userDto: CreateUserDto) {
    // console.log('Received signup request:', userDto);
    try {
      const user = await this.authService.register(userDto);
      // console.log(`user: ${user}`);
      return { message: 'User registered successfully', user };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // @Post('signup')
  // async register(@Body() userDto: CreateUserDto) {
  //   const user = await this.authService.register(userDto);
  //   const token = this.authService.generateToken(user);
  //   return { user, token };
  // }

  // @Get('check-token')
  // @UseGuards(JwtAuthGuard)
  // async checkToken(@Req() req) {
  //   return { user: req.user };
  // }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @UseGuards(LoginSessionGuard)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    try {
      // console.log('Received login request:', loginDto);
      const userInfo = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      if (userInfo) {
        const { id, username, email } = userInfo;
        // res.cookie('login', JSON.stringify({ id, username, email }), {
        //   httpOnly: false,
        //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        // });

        req.session.user = { id, username, email };

        return res.send({
          message: 'Login successful',
          user: req.session.user,
        });
      } else {
        throw new HttpException(
          'Invalid email or password',
          HttpStatus.UNAUTHORIZED,
        );
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // @UseGuards(LoginGuard)
  // async login(@Body() loginDto: LoginDto) {
  //   const user = await this.authService.validateUser(
  //     loginDto.email,
  //     loginDto.password,
  //   );
  //   if (!user) {
  //     return { message: 'Invalid credentials' };
  //   }
  //   const token = this.authService.generateToken(user);
  //   return { user, token };
  // }

  // @HttpCode(HttpStatus.OK)
  // @UseGuards(LocalAuthGuard)
  // @Post('/login2')
  // async login2(@Request() req: any, @Response() res: any) {
  //   if (!req.cookies['login'] && req.user) {
  //     res.cookie('login', JSON.stringify(req.user), {
  //       httpOnly: true,
  //       maxAge: 1000 * 10, // 10 seconds for testing
  //     });
  //     return res.send({ message: 'Login2 successful', user: req.user });
  //   }
  //   return res.send({ message: 'Already logged in' });
  // }

  @Post('logout')
  async logout(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    req.session.destroy((err: any) => {
      if (err) {
        res.status(500).send('Logout failed');
      } else {
        res.clearCookie('connect.sid');
        res.send({ message: 'Logout successful' });
      }
    });
  }

  @Get('check-session')
  @UseGuards(AuthenticatedSessionGuard)
  async checkSession(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    const user = req.session.user;
    if (user) {
      return res.send({ user });
    } else {
      return res.status(401).send('No active session');
    }
  }

  // @Get('google')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuth(@Req() req) {
  //   // Initiates the Google OAuth2 login flow
  // }

  // @Get('google/redirect')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuthRedirect(@Req() req, @Res() res) {
  //   const { user } = req;
  //   res.cookie('login', JSON.stringify(user), {
  //     httpOnly: true,
  //     maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  //   });
  //   return res.redirect('/success'); // Redirect to your desired route after successful login
  // }

  // @UseGuards(LoginGuard)
  // @Get('tests-guard')
  // testGuard() {
  //   return 'logged in';
  // }

  // @UseGuards(LocalAuthGuard)
  // @Post('login3')
  // login3(@Request() req: any) {
  //   return req.user;
  // }

  // @UseGuards(AuthenticatedGuard)
  // @Get('tests-guard2')
  // testGuardWithSession(@Request() req: any) {
  //   return req.user;
  // }

  // @Get('google')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuth(@Req() req: ExpressRequest) {
  //   console.log('get to-google');
  // }

  // @Get('google/redirect')
  // @UseGuards(GoogleAuthGuard)
  // async googleAuthRedirect(
  //   @Req() req: ExpressRequest,
  //   @Res() res: ExpressResponse,
  // ) {
  //   const { user } = req;
  //   console.log('req : ', user);
  //   // return res.send(user);
  //   res.cookie('login', JSON.stringify(user), {
  //     httpOnly: true,
  //     maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  //   });
  //   return res.redirect('/success');
  // }

  // @UseGuards(AuthenticatedGuard)
  // @Post('logout')
  // async logout(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
  //   req.logout((err: any) => {
  //     if (err) {
  //       return res
  //         .status(HttpStatus.INTERNAL_SERVER_ERROR)
  //         .send({ message: 'Logout failed', error: err });
  //     }
  //     res.clearCookie('login');
  //     return res.send({ message: 'Logout successful' });
  //   });
  // }

  // @UseGuards(GithubAuthGuard)
  // @Get('github')
  // async githubAuth(@Req() req: ExpressRequest) {
  //   // Initiates the GitHub OAuth2 login flow
  // }

  // @UseGuards(GithubAuthGuard)
  // @Get('github/redirect')
  // async githubAuthRedirect(
  //   @Req() req: ExpressRequest,
  //   @Res() res: ExpressResponse,
  // ) {
  //   const { user } = req;
  //   res.cookie('login', JSON.stringify(user), {
  //     httpOnly: true,
  //     maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  //   });
  //   return res.redirect('/success'); // Redirect to your desired route after successful login
  // }
}
