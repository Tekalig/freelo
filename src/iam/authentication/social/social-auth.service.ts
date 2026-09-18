import {
  Inject,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as config from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import googleConfig from 'src/config/google.config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SocialAuthService implements OnModuleInit {
  private goodleAuth: OAuth2Client;

  onModuleInit() {
    this.goodleAuth = new OAuth2Client(
      this.googleAuthConfig.clientId,
      this.googleAuthConfig.clientSecret,
    );
  }

  constructor(
    @Inject(googleConfig.KEY)
    private readonly googleAuthConfig: config.ConfigType<typeof googleConfig>,
    private readonly userService: UsersService,
  ) {}

  async loginWithGoodle(idToken: string) {
    const payload = await this.verifyGoogleToken(idToken);

    let user = await this.userService.findProviderId('google', payload.sub);

    if (!user) {
      user = await this.userService.findByEmail(payload.email);

      if (user) {
        user = await this.userService.linkProviderId(
          user.id,
          'google',
          payload.sub,
          payload.email,
        );
      } else {
        user = await this.userService.createFromSocial({
          provider: 'google',
          providerId: payload.sub,
          email: payload.email,
          fullName: payload.name ?? '',
        });
      }
    }
    await this.userService.assignDefualtRole(user.id);
    return user;
  }

  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await this.goodleAuth.verifyIdToken({
        idToken,
        audience: this.googleAuthConfig.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException('Invalid Token or Expired');
      }
      return payload;
    } catch (err) {
      throw new UnauthorizedException('Invalid Token or Expired');
    }
  }
}
