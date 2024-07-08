import { IsNotEmpty, IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password?: string;

  // @IsOptional()
  // @IsString()
  // name?: string;

  // @IsOptional()
  // phoneNumber?: string;

  // @IsOptional()
  // avatarUrl?: string;
}
