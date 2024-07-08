import { IsOptional, IsString, IsInt, IsNotEmpty } from 'class-validator';

export class AddUserToRoomDto {
  @IsNotEmpty()
  @IsInt()
  roomId: number;

  @IsNotEmpty()
  @IsInt()
  userId: number;

  @IsOptional()
  @IsString()
  personalizedRoomName?: string;
}
