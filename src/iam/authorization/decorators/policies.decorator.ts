import { SetMetadata } from '@nestjs/common';
import { AppAbility } from '../factory/casl-ability.factory';

interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandlerType = PolicyHandler | PolicyHandlerCallback;

export const CHECK_POLICIES_KEY = 'check_policy';
export const CheckPolicies = (...handlers: PolicyHandlerType[]) =>
  SetMetadata(CHECK_POLICIES_KEY, handlers);
