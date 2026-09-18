export interface ActiveUserWithRoles {
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
