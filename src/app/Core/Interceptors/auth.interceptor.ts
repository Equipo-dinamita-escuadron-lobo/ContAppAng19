import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // Rutas completamente públicas (todos los métodos)
    const fullyPublicRoutes = [
      `${environment.keycloak_url_token}`
    ];

    // Rutas públicas solo para métodos GET
    const publicGetRoutes = [
      '/api/config/help-center/'
    ];

    // Verificar si la ruta es completamente pública
    const isFullyPublic = fullyPublicRoutes.some(route => req.url.includes(route));

    // Verificar si es una ruta pública GET
    const isPublicGet = req.method === 'GET' &&
                        publicGetRoutes.some(route => req.url.includes(route));

    // Si es pública, continuar sin token
    if (isFullyPublic || isPublicGet) {
      return next(req);
    }

    // Agregar token para rutas protegidas
    const token = localStorage.getItem('token');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
};
