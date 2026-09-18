import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../factory/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandlerType,
} from '../decorators/policies.decorator';
import { ActiveUserWithRoles } from 'src/iam/interfaces/active-user-roles.interface';
import express from 'express';
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}
  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.getAllAndOverride<PolicyHandlerType[]>(
        CHECK_POLICIES_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    if (policyHandlers.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user: ActiveUserWithRoles = request.user;

    if (!user) throw new ForbiddenException('No authenticated user found');

    const ability = this.caslAbilityFactory.createForUser(user);

    const allowed = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!allowed)
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    return true;
  }

  private execPolicyHandler(handler: PolicyHandlerType, ability: any) {
    if (typeof handler === 'function') return handler(ability);
    return handler.handle(ability);
  }
}
