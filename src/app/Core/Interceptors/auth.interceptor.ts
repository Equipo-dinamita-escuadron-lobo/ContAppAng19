import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { BYPASS_AUTH } from './http-context';
import { AuthService } from '../auth/services/auth.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // --- INICIO DE DEBUG ---
  // Imprime cada petición que el interceptor ve
  console.log(`[Interceptor] Petición a: ${req.url}`);
  
  // Revisa si la bandera BYPASS_AUTH está presente
  const bypass = req.context.get(BYPASS_AUTH);
  console.log(`[Interceptor] ¿Tiene bandera BYPASS_AUTH?: ${bypass}`);
  // --- FIN DE DEBUG ---

  // Si la bandera es true, omite el token
  if (bypass === true) {
    console.log(`[Interceptor] Omitiendo token para ${req.url}`);
    return next(req);
  }

  const token = authService.getToken();

  // Si no hay bandera y no hay token, la deja pasar
  if (!token) {
    console.log(`[Interceptor] No hay token, petición normal para ${req.url}`);
    return next(req);
  }

  // Si no hay bandera PERO SÍ hay token, lo añade
  console.log(`[Interceptor] Añadiendo token para ${req.url}`);
  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      const isUnauthorized = error.status === 401;
      const isRefreshRequest = req.url.includes('/token/refresh');

      if (!isUnauthorized || isRefreshRequest) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.handleSessionExpired();
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshAccessToken().pipe(
          switchMap((tokens) => {
            refreshTokenSubject.next(tokens.access_token);

            const retriedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${tokens.access_token}`,
              },
            });

            return next(retriedRequest);
          }),
          catchError((refreshError) => {
            authService.handleSessionExpired();
            return throwError(() => refreshError);
          }),
          finalize(() => {
            isRefreshing = false;
          })
        );
      }

      return refreshTokenSubject.pipe(
        filter((newToken): newToken is string => !!newToken),
        take(1),
        switchMap((newToken) => {
          const retriedRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${newToken}`,
            },
          });

          return next(retriedRequest);
        })
      );
    })
  );
};