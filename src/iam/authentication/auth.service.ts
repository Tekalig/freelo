import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import jwtConfig from 'src/config/jwt.config';
import * as config from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { randomUUID } from 'crypto';
import express from 'express';
import { TwoFaService } from './2fa/two-fa.service';

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
      const user = new User();
      user.fullName = signUpDto.full_name;
      user.email = signUpDto.email;
      user.password = await this.hashService.hash(signUpDto.password);

      await this.user.save(user);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('User already exist!!');
      }
    }
  }

  async validateUser(userDto: SignInDto): Promise<Partial<User> | null> {
    const user = await this.user
      .createQueryBuilder('user')
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
