import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthType } from '../enums/auth-type.enum';
import { AccessTokenGuard } from './access-token.guard';
import { LocalGuard } from './local.guard';
import { AUTH_TYPE_KEY } from '../decorators/auth.decorator';
import { RefreshTokenGuard } from './refresh-token.guard';
import { ApiKeyGuard } from './api-key.guard';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  private static readonly defaultAuth = AuthType.Cookies;
  private readonly authTypeMap: Record<AuthType, CanActivate | CanActivate[]>;

  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokenGuard: AccessTokenGuard,
    private readonly localGuard: LocalGuard,
    private readonly refreshTokenGuard: RefreshTokenGuard,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {
    this.authTypeMap = {
      [AuthType.Cookies]: this.accessTokenGuard,
      [AuthType.Local]: this.localGuard,
      [AuthType.ApiKey]: this.apiKeyGuard,
      [AuthType.Refresh]: this.refreshTokenGuard,
      [AuthType.None]: { canActivate: () => true },
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authType = this.reflector.getAllAndOverride<AuthType[]>(
      AUTH_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [AuthenticationGuard.defaultAuth];

    // map the types to there perspective guards
    const guards = authType.map((type) => this.authTypeMap[type]).flat();

    // error handles
    let error = new UnauthorizedException();

    for (const instance of guards) {
      const canActivate = await Promise.resolve(
        instance.canActivate(context),
      ).catch((err) => {
        error = err;
      });

      if (canActivate) {
        return true;
      }
    }

    throw error;
  }
}
