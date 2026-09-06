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
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly twoFaSarvice: TwoFaService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguation: config.ConfigType<typeof jwtConfig>,
  ) {}

  async signIn(
    userId: string,
    email: string,
    emailVerified: boolean,
    plan: string,
  ) {
    const user = await this.usersService.findByIdForFaSecret(userId);

    if (user?.isTwoFaEnabled) {
      const pendingTokenOptions: JwtSignOptions = {
        secret: this.jwtConfiguation.secret,
        expiresIn: '5m',
      };

      const pendingToken = await this.jwtService.signAsync(
        {
          sub: userId,
          twoFaPending: true,
        },
        pendingTokenOptions,
      );
      return { pendingToken, requiresTwoFactor: true as const };
    }
    return this.generateTokens(userId, email, emailVerified, plan);
  }

  async loginWithTwoFactor(pendingToken: string, code: string) {
    let payload: { sub: string; twoFaPending: boolean };

    try {
      payload = await this.jwtService.verifyAsync(pendingToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or Expired 2FA session');
    }
    if (!payload.twoFaPending) {
      throw new UnauthorizedException('Invalid 2FA session');
    }
    const isValid = await this.twoFaSarvice.validateLoginToken(
      payload.sub,
      code,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA session');
    }

    const user = await this.usersService.findOne(payload.sub);
    return this.generateTokens(
      user.id,
      user.email,
      user.emailVerified,
      user.plan,
    );
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

  async logout(userId: string) {
    await this.usersService.updateHashedRefreshToken(userId, null);
  }

  async refreshToken(userId: string, email: string, refreshToken: string) {
    const user = await this.usersService.findByIdWithRefreshToken(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const inComingHash = this.hashService.hashToken(refreshToken);

    const isMatch = this.hashService.compareHashes(
      inComingHash,
      user.hashedRefreshToken,
    );

    if (!isMatch) {
      await this.usersService.updateHashedRefreshToken(userId, null);
      throw new UnauthorizedException('Access denied');
    }

    return this.generateTokens(userId, email, user.emailVerified, user.plan);
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

  private async generateTokens(
    userId: string,
    email: string,
    emailVerified: boolean,
    plan: string,
  ) {
    const accessTokenOptions: JwtSignOptions = {
      secret: this.jwtConfiguation.secret,
      expiresIn: this.jwtConfiguation.accessTokenTtl,
      issuer: this.jwtConfiguation.issuer,
      audience: this.jwtConfiguation.audience,
    };

    const refreshTokenOptions: JwtSignOptions = {
      secret: this.jwtConfiguation.refreshSecret,
      expiresIn: this.jwtConfiguation.refreshTokenTtl,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
          emailVerified: emailVerified,
          plan: plan,
        },
        accessTokenOptions,
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email: email,
          jti: randomUUID(),
        },
        refreshTokenOptions,
      ),
    ]);

    const hashedRefreshToken = this.hashService.hashToken(refreshToken);

    await this.usersService.updateHashedRefreshToken(
      userId,
      hashedRefreshToken,
    );

    return { accessToken, refreshToken };
  }

  public setAuthCookies(
    res: express.Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie('access_token', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 3600000,
    });

    res.cookie('refresh_token', refreshToken, {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: 8640000,
    });
  }
}
