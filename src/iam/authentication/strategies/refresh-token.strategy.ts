import { Inject, Injectable } from '@nestjs/common';
import * as config from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwtConfig from 'src/config/jwt.config';
import { Request } from 'express';

const cookieExtractor = (req: Request) => {
  let data = null;
  if (req && req.cookies) {
    data = req?.cookies['refresh_token'];
  }
  return data;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: config.ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.refreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; email: string }) {
    const refreshToken = req.cookies?.refresh_token;

    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken: refreshToken,
    };
  }
}
