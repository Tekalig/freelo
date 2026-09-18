import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { generateSecret, verify, generateURI } from 'otplib';

@Injectable()
export class TwoFaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UsersService,
  ) {}

  async generateSecretForUser(userId: string, email: string) {
    const secret = generateSecret();
    await this.userService.setTwoFactorSecret(userId, secret);

    const otpauthUrl = generateURI({
      secret: secret,
      label: email,
      issuer: this.configService.getOrThrow<string>('FA_APP_NAME'),
    });

    return otpauthUrl;
  }

  async verfiyAndEnable(userId: string, token: string) {
    const user = await this.userService.findByIdForFaSecret(userId);
    if (!user?.twoFaSecret)
      throw new UnauthorizedException(
        'No 2FA setup in progress for this account',
      );

    const result = await verify({ secret: user?.twoFaSecret, token: token });
    if (!result.valid) {
      throw new UnauthorizedException('Invalid Token');
    }

    await this.userService.enableTwoFactor(userId);

    return { message: '2FA enabled successfully' };
  }

  async validateLoginToken(userId: string, token: string) {
    const user = await this.userService.findByIdForFaSecret(userId);

    if (!user?.twoFaSecret || !user.isTwoFaEnabled) {
      return false;
    }

    const result = await verify({ secret: user.twoFaSecret, token: token });
    return result.valid;
  }

  async disable(userId: string) {
    await this.userService.disableTwoFactor(userId);
    return { message: '2FA disabled' };
  }
}
