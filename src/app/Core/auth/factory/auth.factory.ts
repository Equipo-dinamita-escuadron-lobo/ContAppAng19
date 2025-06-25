import { AuthService } from '../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Función factory para APP_INITIALIZER
// Se inyecta el AuthService
export function initializeAuthFactory(authService: AuthService): () => Promise<any> {
  // Esta función interna se ejecutará durante la inicialización de la app
  return () => lastValueFrom(authService.initializeAppStatus().pipe(
    // Captura cualquier error que ocurra durante initializeAppStatus
    // para que la aplicación no falle al iniciar.
    catchError(err => {
      console.error('APP_INITIALIZER: Error during AuthService initialization', err);
      // Decide cómo manejar el error de inicialización.
      // Devolver Promise.resolve() permite que la app continúe cargando
      // (el usuario estará como no autenticado).
      // Si quieres que la app *no* cargue en caso de fallo de inicialización, usa throwError.
      return Promise.resolve(); // Permite que la app inicie incluso si falla la autenticación inicial
    })
  ));
}
