import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';

export const isAuthenticatedGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  if (auth.sessionExpiredVisible()) {
    return false;
  }

  router.navigate(['/login']);
  return false;
};

export const isAuthenticatedChildGuard: CanActivateChildFn = (route, state) =>
  isAuthenticatedGuard(route, state);
