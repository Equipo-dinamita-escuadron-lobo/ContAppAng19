import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

export const hasPermissionGuard = (permissions: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const messageService = inject(MessageService);

    if (authService.isAuthenticated()) {
      const userPermissions = authService.getCurrentUserPermissions();

      const hasPermission = permissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (hasPermission) {
        return true;
      } else {
        // Mostrar Toast sin redirigir
        messageService.add({
          severity: 'error',
          summary: 'Acceso denegado',
          detail: 'No tienes permisos para acceder a esta sección',
          life: 3000,
        });

        return false; // bloquea la navegación, se queda en la ruta actual
      }
    }

    // Si no está autenticado -> redirigir
    router.navigate(['/login']);
    return false;
  };
};
