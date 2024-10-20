import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
// import { AuthenticatedGuard } from '../auth/guards/local.auth.guard';
import {
  Request as ExpressRequest,
  // Response as ExpressResponse,
} from 'express';
import { JwtAuthGuard } from '../auth/guards/jtw.auth.guard';
// import { JwtAuthGuard } from '../auth/guards/local.auth.guard';
// import { PassportModule } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('/create')
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  } //

  @Get('/getUser/:email')
  async findOne(@Param('email') email: string) {
    return this.usersService.findOneByEmail(email);
  }

  @Put('/update/:email')
  async update(
    @Param('email') email: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(email, updateUserDto);
  }

  @Delete('/delete/:email')
  async remove(@Param('email') email: string) {
    return this.usersService.remove(email);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    // console.log(`req : ${JSON.stringify(Object.keys(req.session.user))}`);
    // const userId = req.session.user.id;
    // const userId = req.user.userId;
    console.log(`JSON: ${JSON.stringify(req.user)}`);
    const userId = req.user['userId'];
    const user = await this.usersService.findOneById(userId);
    console.log(`user ${JSON.stringify(user)}`);
    return user
      ? { id: user.id, email: user.email, username: user.username }
      : null;
  }

  @UseGuards(JwtAuthGuard)
  @Post('/add-friend')
  async addFriend(@Req() req: any, @Body('friendEmail') friendEmail: string) {
    // console.log(`user id ${JSON.stringify(req)})}`);
    // console.log(`friend email(controller) ${friendEmail}`);
    // const userId = req.userId;
    const userId = req.user['userId'];
    return this.usersService.addFriend(userId, friendEmail);
  }

  @Get('/getUserSecure/:email')
  async findOneSecure(@Param('email') email: string) {
    return this.usersService.findOneByEmailSecure(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/friends')
  async getFriends(@Req() req: any) {
    // const userId = req.session.user.id;
    const userId = req.user['userId'];
    const user = await this.usersService.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const friends = await Promise.all(
      user.friends.map((friend) =>
        this.usersService.findOneByEmailSecure(friend.email),
      ),
    );
    // console.log(`user : ${JSON.stringify(user)}`);
    // console.log(`User friends ${JSON.stringify(user.friends)}`);
    return { friends };
  }
}
