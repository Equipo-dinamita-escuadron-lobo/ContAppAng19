import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { UserRole } from '../auth/models/user-profile';
import { Router } from '@angular/router';


export const hasRoleGuard = (roles: UserRole[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    if(authService.isAuthenticated()){
      const user = authService.getCurrentUserRoles();
      const hasRole = roles.some(role => user.includes(role));
      if (hasRole) {
        return true;
      } else {
        authService.logout();
        router.navigate(['/login']);
        return false;
      }
    }
    router.navigate(['/login']);
    return false;
  };

};

