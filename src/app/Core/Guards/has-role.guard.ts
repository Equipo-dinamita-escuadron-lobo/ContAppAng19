import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserRole } from '../auth/models/user-profile';


export const hasRoleGuard = (roles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    if(authService.isAuthenticated()){
      const user = authService.getCurrentUserRoles();
      const hasRole = roles.some(role => user.includes(role));
      if (hasRole) {
        return true;
      } else {
        authService.logout();
        return false;
      }
    }
    return false;
  };

};

