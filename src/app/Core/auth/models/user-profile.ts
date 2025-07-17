export type UserRole = 'admin_realm' | 'user_realm' | 'super_realm';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
}
