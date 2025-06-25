
import { environment } from '../../../../environments/environment';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap, delay } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode'; // Importar la librería
import { Login } from '../models/login';
import { UserProfile } from '../models/user-profile';
import { DecodedToken } from '../models/decoded-token';


const keycloakUrl = environment.keycloak_url;

export interface PayloadToken {
  access_token: string;
  refresh_expires_in: number;
  expires_in: number;
}


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  router = inject(Router);
  http = inject(HttpClient);

  // Mantén el estado del token
  private _currentUser = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this._currentUser.asObservable();

  // Señal para saber si se está autenticando
  isAuthenticated = signal<boolean>(this.hasToken());

  constructor() {

  }


  initializeAppStatus(): Observable<UserProfile | null> {
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      console.log('AuthService Init: No valid token found.');
      this.removeToken(); // Asegura la limpieza si el token es inválido
      this.isAuthenticated.set(false);
      this._currentUser.next(null);
      // Devuelve un observable que emite null y se completa inmediatamente.
      return of(null);
    }

    console.log('AuthService Init: Valid token found. Attempting to fetch user...');
    // Si hay token válido, intenta obtener el usuario.
    // fetchAndSetUser ya maneja el estado en memoria y devuelve un observable.
    return this.fetchAndSetUser().pipe(
      // Después de que fetchAndSetUser complete (éxito o error con of(null)),
      // actualiza el estado isAuthenticated.
      tap(user => {
        if (user) {
          this.isAuthenticated.set(true);
          console.log('AuthService Init: User fetched successfully. isAuthenticated = true.');
        } else {
          // Esto sucede si fetchAndSetUser devolvió of(null) por error
          this.isAuthenticated.set(false);
          console.log('AuthService Init: Failed to fetch user. isAuthenticated = false.');
        }
      }),
      catchError(err => {
         // Este catchError atraparía errores que *no* fueron manejados por el catchError interno
         // de fetchAndSetUser.
         console.error('AuthService Init: Unhandled error during fetch:', err);
         this.logout(); // Asegura el logout en caso de cualquier error de inicialización
         this.isAuthenticated.set(false);
         this._currentUser.next(null);
         return of(null); // Asegura que el observable complete correctamente
      })
    );
  }


  public login(auth: Login) {
    return this.http.post<{ access_token: string }>(`${keycloakUrl}keycloak/token/`, auth).pipe(
      tap(res => this.saveToken(res.access_token)), // Guarda el token primero
      switchMap(() => this.fetchAndSetUser()), // Luego obtiene y guarda el usuario en memoria
      tap(() => this.isAuthenticated.set(true)), // Actualiza la señal
      tap(() => {
        this.router.navigate(['/enterprise']);
      }),
      catchError(error => {
        console.error("Login failed:", error);
        this.isAuthenticated.set(false);
        // Devuelve un observable que emite null o propaga el error como prefieras
        return of(null);
      })
    );
  }

  // Obtiene el usuario del backend usando el token actual y actualiza el BehaviorSubject
  private fetchAndSetUser() {
    return this.http.get<UserProfile>(`${keycloakUrl}keycloak/getCurrentUser`).pipe(
       tap(user => {
         this._currentUser.next(user); // Actualiza estado en memoria
         console.log("User data fetched:", user);
       }),
       catchError(error => {
         console.error("Failed to fetch user data:", error);
         this._currentUser.next(null); // Limpia el usuario si falla
         return of(null); // Devuelve null en caso de error
       })
    );
  }

  // Guarda el token en localStorage
  public saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Obtiene el token de localStorage
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verifica si existe un token
  private hasToken(): boolean {
    return !!this.getToken();
  }

  // Decodifica el token (SOLO para leer claims, NO verifica firma)
  private decodeToken(token: string): DecodedToken | null {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (Error) {
      console.error("Failed to decode token:", Error);
      return null;
    }
  }

  // Verifica si el token ha expirado (basado en claim 'exp')
  private isTokenExpired(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true; // Si no se puede decodificar o no tiene 'exp', se tráta como expirado/inválido
    }
    const expiryDate = new Date(0);
    expiryDate.setUTCSeconds(decoded.exp);
    return expiryDate.valueOf() < new Date().valueOf();
  }


  // Cierra sesión
  public logout(): void {
    this.removeToken();
    this._currentUser.next(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']); // Redirige al login
  }

  // Remueve el token
  private removeToken(): void {
    localStorage.removeItem('token');
  }


  // Obtiene los roles actuales del usuario (desde el estado en memoria)
  public getCurrentUserRoles(): string[] {
    return this._currentUser.value?.roles || [];
  }

  // Verifica si el usuario actual tiene un rol específico
  public hasRole(role: string): boolean {
    return this.getCurrentUserRoles().includes(role);
  }
}
