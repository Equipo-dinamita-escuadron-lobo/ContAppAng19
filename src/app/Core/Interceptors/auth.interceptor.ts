import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const excludedRoutes = [
      `${environment.keycloak_url_token}`
    ];

    if (excludedRoutes.some(route => req.url.startsWith(route))) {
      return next(req);
    }
    const token = localStorage.getItem('token');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
};
