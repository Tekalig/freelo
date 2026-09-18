import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UsersService } from 'src/users/users.service';
import express from 'express';
import { TwoFaService } from './2fa/two-fa.service';
import { Role } from '../authorization/roles/entities/role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly user: Repository<User>,
    private readonly hashService: HashingService,
    private readonly usersService: UsersService,
    private readonly twoFaSarvice: TwoFaService,
  ) {}

  async signIn(
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      plan: string;
      isTwoFaEnabled: boolean;
      roles: Role[];
    },
    req: express.Request,
  ) {
    if (user?.isTwoFaEnabled) {
      req.session.pendingTwoFactorUserId = user.id;
      return await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({ requiresTwoFactor: true });
        });
      });
    }
    return this.establishSession(req, user);
  }

  async loginWithTwoFactor(token: string, req: express.Request) {
    const pendingUserId = req.session.pendingTwoFactorUserId;
    if (!pendingUserId) {
      throw new UnauthorizedException('No pending 2FA session');
    }

    const isValid = await this.twoFaSarvice.validateLoginToken(
      pendingUserId,
      token,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    delete req.session.pendingTwoFactorUserId;

    const user = await this.usersService.findOne(pendingUserId);
    return this.establishSession(req, user);
  }

  async signUp(signUpDto: SignUpDto) {
    try {
      const password = await this.hashService.hash(signUpDto.password);
      const newUser = this.user.create({
        fullName: signUpDto.full_name,
        email: signUpDto.email,
        password: password,
      });

      const user = await this.user.save(newUser);
      await this.usersService.assignDefualtRole(user.id);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('User already exist!!');
      }
    }
  }

  async validateUser(userDto: SignInDto): Promise<Partial<User> | null> {
    const user = await this.user
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .addSelect('user.password')
      .where('user.email = :email', { email: userDto.email })
      .getOne();
    if (
      user &&
      (await this.hashService.compare(userDto.password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, hashedRefreshToken, ...result } = user;
      return result;
    }

    return null;
  }

  public establishSession(
    req: express.Request,
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
      plan: string;
      isTwoFaEnabled: boolean;
      roles: Role[];
    },
  ) {
    return new Promise((resolve, reject) => {
      req.login(user, (err) => {
        if (err) return reject(err);
        resolve({ message: 'Logged in successfully!' });
      });
    });
  }
}
