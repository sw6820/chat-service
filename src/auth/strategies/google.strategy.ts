// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, VerifyCallback } from 'passport-google-oauth20';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from '../auth.service';
//
// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
//   constructor(
//     private readonly configService: ConfigService,
//     private readonly authService: AuthService,
//   ) {
//     super({
//       clientID: configService.get<string>('GITHUB_CLIENT_ID'),
//       clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
//       callbackURL: 'http://localhost:3000/auth/google/redirect', // Adjust the callback URL as needed
//       scope: ['email', 'profile'],
//     });
//   }
//
//   async validate(
//     accessToken: string,
//     refreshToken: string,
//     profile: any,
//     done: VerifyCallback,
//   ): Promise<any> {
//     const { name, emails, photos } = profile;
//     const user = {
//       email: emails[0].value,
//       firstName: name.givenName,
//       lastName: name.familyName,
//       picture: photos[0].value,
//       accessToken,
//     };
//     const validatedUser = await this.authService.validateOAuthUser(user);
//     if (!validatedUser) {
//       throw new UnauthorizedException();
//     }
//     done(null, validatedUser);
//   }
// }
