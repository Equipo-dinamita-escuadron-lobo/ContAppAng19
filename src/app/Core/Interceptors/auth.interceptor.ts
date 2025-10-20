import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('token');

    // Si no hay token, simplemente deja pasar la petición sin modificarla.
    if (!token) {
      return next(req);
    }

    // Si hay un token, clona la petición y añade la cabecera de autorización.
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(cloned);
};
