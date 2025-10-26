import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BYPASS_AUTH } from './http-context';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

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

  const token = localStorage.getItem('token');

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

  return next(cloned);
};