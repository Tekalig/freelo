import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { REQUIRE_CLAIM_KEY } from '../decorators/claim.decorator';

@Injectable()
export class RequireClaimGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const required = this.reflector.getAllAndOverride<{
      claim: string;
      value: any;
    }>(REQUIRE_CLAIM_KEY, [context.getHandler(), context.getClass()]);

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user?.[required.claim] !== required.value) {
      throw new ForbiddenException(
        `This action requires ${required.claim === 'plan' ? 'upgrade plan' : 'verified email'}`,
      );
    }

    return true;
  }
}
