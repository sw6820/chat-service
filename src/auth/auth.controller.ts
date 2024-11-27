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
// import {
//   AuthenticatedSessionGuard,
// GoogleAuthGuard,
// LocalAuthGuard,
// LoginSessionGuard,
// } from './guards/local.auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
// import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jtw.auth.guard';
// import { AuthGuard } from '@nestjs/passport';
// import { GithubAuthGuard } from './guards/github.auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: using JWT & guard
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

  // Use the JWT guard to protect the route
  @Get('check-token')
  @UseGuards(JwtAuthGuard)
  async checkToken(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
    console.log('Checking JWT token');

    // req.user will contain the decoded user information from the JWT
    const user = req.user;
    console.log(`Decoded user from JWT: ${JSON.stringify(user)}`);

    if (user) {
      console.log(`Returning user data`);
      return res.send({ user });
    } else {
      console.log(`Invalid or expired token`);
      return res.status(401).send('Invalid or expired token');
    }
  }

  // @Get('check-session')
  // @UseGuards(AuthenticatedSessionGuard)
  // async checkSession(@Req() req: ExpressRequest, @Res() res: ExpressResponse) {
  //   console.log('Checking session');
  //   const user = req.session.user;
  //   console.log(`session ${JSON.stringify(req.session)}`);
  //   console.log(`user : ${JSON.stringify(user)}`);
  //   if (user) {
  //     console.log(`res send user`);
  //     return res.send({ user });
  //   } else {
  //     console.log(`fail session`);
  //     return res.status(401).send('No active session');
  //   }
  // }

  // User login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  // TODO: guard
  async login(@Body() loginDto: LoginDto, @Res() res: ExpressResponse) {
    try {
      console.log(`auth controller login`);
      console.log('Login Request:', loginDto); // Debugging login request data
      // console.log(`login ${JSON.stringify(loginDto)}`);
      const { access_token } = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );
      console.log(`create token ${access_token}`);
      console.log('Access Token generated in Controller:', access_token); // Debugging access token in controller
      // Optionally set the token in an HTTP-only cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
      console.log(`success login`);
      return res.send({ message: 'Login successful', access_token });
    } catch (error) {
      console.error('Login Error:', error.message); // Debugging login errors
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('login')
  // @UseGuards(LoginSessionGuard)
  // async login(
  //   @Body() loginDto: LoginDto,
  //   @Req() req: ExpressRequest,
  //   @Res() res: ExpressResponse,
  // ) {
  //   console.log(`login request cookie ${JSON.stringify(req.cookies, null)}`);
  //   console.log(`login req session ${JSON.stringify(req.session, null)}`);
  //   // console.log(`req keys ${Object.keys(req)}`);
  //   try {
  //     // console.log('Received login request:', loginDto);
  //     const userInfo = await this.authService.validateUser(
  //       loginDto.email,
  //       loginDto.password,
  //     );
  //     console.log(`user info: ${JSON.stringify(userInfo)}`);
  //     if (userInfo) {
  //       const { id, username, email } = userInfo;
  //       // res.cookie('login', JSON.stringify({ id, username, email }), {
  //       //   httpOnly: false,
  //       //   maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  //       // });
  //
  //       req.session.user = { id, username, email };
  //       console.log(`success login`);
  //       return res.send({
  //         message: 'Login successful',
  //         user: req.session.user,
  //       });
  //     } else {
  //       throw new HttpException(
  //         'Invalid email or password',
  //         HttpStatus.UNAUTHORIZED,
  //       );
  //     }
  //   } catch (error) {
  //     throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
  //   }
  // }

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

  // Protected route example
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req) {
    return { user: req.user };
  }

  // User logout (optional)
  @Post('logout')
  async logout(@Res() res: ExpressResponse) {
    // Clear the cookie if you're using cookies
    res.clearCookie('access_token');
    return res.send({ message: 'Logout successful' });
  }
}
