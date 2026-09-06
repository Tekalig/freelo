import { Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';

const cookieExtractor = (req: Request) => {
  let data = null;
  if (req && req.cookies) {
    data = req?.cookies['access_token'];
  }
  return data;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access_token',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguation: config.ConfigType<typeof jwtConfig>,
    private readonly userService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: jwtConfiguation.secret,
      audience: jwtConfiguation.audience,
      issuer: jwtConfiguation.issuer,
      ignoreExpiration: false,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    emailVerified: boolean;
    plan: string;
  }) {
    const user = await this.userService.findOne(payload.sub);
    return {
      userId: payload.sub,
      email: payload.email,
      roles: user.roles,
      emailVerified: user.emailVerified,
      plan: user.plan,
    };
  }
}
