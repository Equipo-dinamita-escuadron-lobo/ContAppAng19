export type UserRole = 'admin_realm' ;

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
}
