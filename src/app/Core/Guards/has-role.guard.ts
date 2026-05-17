import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const hasRoleGuard = (): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
      const roles: string[] = authService.getCurrentUserRoles(); // string[]
      const isAdmin = roles.includes('Administrador');

      if (isAdmin) {
        return true;
      } else {
        authService.logout();
        router.navigate(['/login']);
        return false;
      }
    }

    if (authService.sessionExpiredVisible()) {
      return false;
    }

    router.navigate(['/login']);
    return false;
  };
};

export const hasRoleChildGuard: CanActivateChildFn = (route, state) =>
  hasRoleGuard()(route, state);
