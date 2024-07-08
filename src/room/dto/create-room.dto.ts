import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  usernames: string[];

  @IsNotEmpty()
  @IsBoolean()
  isGroup: boolean;
}
