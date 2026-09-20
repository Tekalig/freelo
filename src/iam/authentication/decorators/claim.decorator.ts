import { SetMetadata } from '@nestjs/common';

export const REQUIRE_CLAIM_KEY = 'requireClaim';

export const RequireClaimKey = (claim: string, value: any) =>
  SetMetadata(REQUIRE_CLAIM_KEY, { claim, value });
