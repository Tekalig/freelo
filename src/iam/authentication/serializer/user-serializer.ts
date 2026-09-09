import { PassportSerializer } from '@nestjs/passport';
import { ActiveUserData } from 'src/iam/interfaces/active-user-data.interface';
import { User } from 'src/users/entities/user.entity';

export class UserSerializer extends PassportSerializer {
  serializeUser(
    user: User,
    done: (err: Error | null, user: ActiveUserData) => void,
  ) {
    done(null, {
      userId: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      plan: user.plan,
    });
  }
  deserializeUser(
    payload: ActiveUserData,
    done: (err: Error | null, user: ActiveUserData) => void,
  ) {
    done(null, payload);
  }
}
