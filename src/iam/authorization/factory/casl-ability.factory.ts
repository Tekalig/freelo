import {
  AbilityBuilder,
  createMongoAbility,
  ExtractSubjectType,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

export type AppAbility = MongoAbility<[string, string]>;

interface ActiveUserWithRoles {
  userId: string;
  roles: {
    name: string;
    permissions: {
      action: string;
      subject: string;
      conditions: Record<string, any> | null;
    }[];
  }[];
}

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: ActiveUserWithRoles) {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    for (const role of user.roles ?? []) {
      for (const permission of role.permissions) {
        const resolvedCondtions = this.resolvePlaceholders(
          permission.conditions,
          user.userId,
        );
        can(
          permission.action,
          permission.subject,
          resolvedCondtions ?? undefined,
        );
      }
    }

    return build();
  }

  private resolvePlaceholders(
    conditions: Record<string, any> | null,
    userId: string,
  ): Record<string, any> | null {
    if (!conditions) return null;

    const resolved: Record<string, any> = {};
    for (const [key, value] of Object.entries(conditions)) {
      resolved[key] = value === '$userId' ? userId : value;
    }

    return resolved;
  }
}
