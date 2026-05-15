import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const hasAnyRoleGuard = (roles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      const userRoles = authService.getCurrentUserRoles();
      const hasRole = userRoles.some(r => roles.includes(r));

      if (hasRole) return true;
      return false;
    }

    router.navigate(['/login']);
    return false;
  };
};