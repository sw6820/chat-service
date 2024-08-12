import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

type DoneCallback = (err: Error | null, user?: any) => void;

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  serializeUser(user: User, done: DoneCallback): void {
    done(null, user.id);
  }

  async deserializeUser(id: any, done: DoneCallback): Promise<void> {
    try {
      const user = await this.usersService.findOneById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  }
}
