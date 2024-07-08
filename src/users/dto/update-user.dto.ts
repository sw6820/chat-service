// src/users/dto/update-user.dto.ts

import { IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  username?: string;

  @IsString()
  password?: string;

  // name?: string;
  // phoneNumber?: string;
  // avatarUrl?: string;
  // status?: string;
}
