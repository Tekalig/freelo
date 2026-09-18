import { Role } from '../authorization/roles/entities/role.entity';

export interface ActiveUserData {
  userId: string;

  email: string;

  emailVerified: boolean;

  plan: string;

  roles: Role[];
}
