import { environment } from '../../../../environments/environment';
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient , HttpContext} from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap, delay } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { Login } from '../models/login';
import { UserProfile } from '../models/user-profile';
import { DecodedToken } from '../models/decoded-token';
import { RegisterUser } from '../models/register-user';
import { MessageService } from 'primeng/api';
import { BYPASS_AUTH } from '../../Interceptors/http-context';

const keycloakUrl = environment.keycloak_url;
const keycloakUrlToken = environment.keycloak_url_token;

export interface PayloadToken {
  access_token: string;
  refresh_token: string;
  refresh_expires_in: number;
  expires_in: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  router = inject(Router);
  http = inject(HttpClient);
  messageService = inject(MessageService);

  private bypassAuthContext = new HttpContext().set(BYPASS_AUTH, true);

  // Mantén el estado del token
  private _currentUser = new BehaviorSubject<UserProfile | null>(null);
  currentUser$ = this._currentUser.asObservable();

  // Señal para saber si se está autenticando
  isAuthenticated = signal<boolean>(this.hasToken());
  sessionExpiredVisible = signal<boolean>(false);

  constructor() {}

  initializeAppStatus(): Observable<UserProfile | null> {
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      console.log('AuthService Init: No valid token found.');
      this.removeToken(); // Asegura la limpieza si el token es inválido
      this.removeRefreshToken();
      this.isAuthenticated.set(false);
      this._currentUser.next(null);
      // Devuelve un observable que emite null y se completa inmediatamente.
      return of(null);
    }

    console.log(
      'AuthService Init: Valid token found. Attempting to fetch user...'
    );
    // Si hay token válido, intenta obtener el usuario.
    // fetchAndSetUser ya maneja el estado en memoria y devuelve un observable.
    return this.fetchAndSetUser().pipe(
      // Después de que fetchAndSetUser complete (éxito o error con of(null)),
      // actualiza el estado isAuthenticated.
      tap((user) => {
        if (user) {
          this.isAuthenticated.set(true);
          console.log(
            'AuthService Init: User fetched successfully. isAuthenticated = true.'
          );
        } else {
          // Esto sucede si fetchAndSetUser devolvió of(null) por error
          this.isAuthenticated.set(false);
          console.log(
            'AuthService Init: Failed to fetch user. isAuthenticated = false.'
          );
        }
      }),
      catchError((err) => {
        // Este catchError atraparía errores que *no* fueron manejados por el catchError interno
        // de fetchAndSetUser.
        console.error('AuthService Init: Unhandled error during fetch:', err);
        this.logout().subscribe(); // Asegura el logout en caso de cualquier error de inicialización
        this.isAuthenticated.set(false);
        this._currentUser.next(null);
        return of(null); // Asegura que el observable complete correctamente
      })
    );
  }

  public login(auth: Login) {
    return this.http
      .post<PayloadToken | string>(`${keycloakUrlToken}`, auth, {
        context: this.bypassAuthContext // <-- 3. AÑADIR CONTEXTO
      })
      .pipe(
        map((res) => this.normalizeTokenResponse(res)),
        tap((res) => {
          this.saveToken(res.access_token);
          this.saveRefreshToken(res.refresh_token);
        }),
        switchMap(() => this.fetchAndSetUser()),
        tap(() => this.isAuthenticated.set(true)),
        tap(() => {
          this.router.navigate(['/enterprise/list']);
        }),
        catchError((error) => {
          console.error('Login failed:', error);
          this.isAuthenticated.set(false);
          return throwError(() => error);
        })
      );
  }

  public refreshAccessToken(): Observable<PayloadToken> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<PayloadToken | string>(
        `${keycloakUrlToken}refresh`,
        { refreshToken },
        { context: this.bypassAuthContext }
      )
      .pipe(
        map((res) => this.normalizeTokenResponse(res)),
        tap((res) => {
          this.saveToken(res.access_token);
          this.saveRefreshToken(res.refresh_token);
          this.isAuthenticated.set(true);
        })
      );
  }

  public register(user: RegisterUser): Observable<any> {
    return this.http.post<any>(`${keycloakUrl}register`, user).pipe(
      tap((createdUser) =>
        console.log('Usuario registrado exitosamente:', createdUser)
      ),
      catchError((error) => {
        console.error('Error en registro:', error);
        throw error;
      })
    );
  }

  public forgotPassword(email: string): Observable<void> {
    return this.http
      .post<void>(`${keycloakUrlToken}forgot-password`, { email }, { context: this.bypassAuthContext })
      .pipe(
        tap(() => console.log('Email de recuperación enviado')),
        catchError((error) => {
          console.error('Error enviando email de recuperación:', error);
          throw error;
        })
      );
  }

  public resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<void>(`${keycloakUrl}reset-password`, { token, newPassword })
      .pipe(
        tap(() => console.log('Contraseña reseteada exitosamente')),
        catchError((error) => {
          console.error('Error reseteando contraseña:', error);
          throw error;
        })
      );
  }

  // Obtiene el usuario del backend usando el token actual y actualiza el BehaviorSubject
  private fetchAndSetUser() {
    return this.http.get<UserProfile>(`${keycloakUrl}getCurrentUser`).pipe(
      tap((user) => {
        this._currentUser.next(user); // Actualiza estado en memoria
        console.log('User data fetched:', user);
      }),
      catchError((error) => {
        console.error('Failed to fetch user data:', error);
        this._currentUser.next(null); // Limpia el usuario si falla
        return of(null); // Devuelve null en caso de error
      })
    );
  }
  public concatRoles(): string {
    const user = this._currentUser.value;
    if (!user || !user.roles) {
      return '';
    }
    return user.roles
      .filter((role) => !this.isIdpTechnicalRole(role))
      .map(
        (role) => role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
      )
      .join(', ');
  }

  private isIdpTechnicalRole(role: string): boolean {
    const normalizedRole = role.toLowerCase();

    return (
      normalizedRole === 'offline_access' ||
      normalizedRole === 'uma_authorization' ||
      normalizedRole.startsWith('default-roles-')
    );
  }

  public returnUserInfo(): UserProfile | null {
    return this._currentUser.value;
  }
  // Guarda el token en localStorage
  public saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public saveRefreshToken(refreshToken: string): void {
    localStorage.setItem('refresh_token', refreshToken);
  }

  // Obtiene el token de localStorage
  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
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
      console.error('Failed to decode token:', Error);
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
  public logout(): Observable<void> {
    const token = this.getToken();
    const refreshToken = this.getRefreshToken();
    if (!token) {
      this.forceLogout();
      return of(void 0);
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (refreshToken) {
      headers['X-Refresh-Token'] = refreshToken;
    }

    return this.http
      .post<void>(`${keycloakUrl}token/logout`, {}, { headers })
      .pipe(
        tap(() => {
          this.forceLogout();
        }),
        catchError((error) => {
          console.error('Error en logout:', error);
          // Limpia localmente incluso si falla el backend
          this.forceLogout();
          return of(void 0);
        })
      );
  }

  public forceLogout(): void {
    this.clearSessionState();
    this.router.navigate(['/login']);
  }

  public handleSessionExpired(): void {
    this.clearSessionState();

    // Evita reabrir multiples modales si llegan varios 401 en cascada.
    if (!this.sessionExpiredVisible()) {
      this.sessionExpiredVisible.set(true);
    }
  }

  public acknowledgeSessionExpired(): void {
    this.sessionExpiredVisible.set(false);
    this.router.navigate(['/login']);
  }

  private clearSessionState(): void {
    this.removeToken();
    this.removeRefreshToken();
    this._currentUser.next(null);
    this.isAuthenticated.set(false);
  }

  // Remueve el token
  private removeToken(): void {
    localStorage.removeItem('token');
  }

  private removeRefreshToken(): void {
    localStorage.removeItem('refresh_token');
  }

  private normalizeTokenResponse(response: PayloadToken | string): PayloadToken {
    if (typeof response === 'string') {
      return JSON.parse(response) as PayloadToken;
    }

    return response;
  }

  // Obtiene los roles actuales del usuario (desde el estado en memoria)
  public getCurrentUserRoles(): string[] {
    return this._currentUser.value?.roles || [];
  }

  // Verifica si el usuario actual tiene un rol específico
  public hasRole(role: string): boolean {
    return this.getCurrentUserRoles().includes(role);
  }

  public getCurrentUserPermissions(): string[] {
    const token = this.getToken();
    if (!token) return [];

    const decodedToken = JSON.parse(atob(token.split('.')[1]));

    const permissions = decodedToken.authorization?.permissions || [];

    // Flatten: rsname + each scope => "Resource#scope"
    const flattened: string[] = [];

    for (const p of permissions) {
      const resource = p.rsname;
      const scopes: string[] = Array.isArray(p.scopes) ? p.scopes : [];

      for (const s of scopes) {
        flattened.push(`${resource}#${s}`);
      }
    }

    return flattened;
  }
  requireAnyPermission(required: string[]): boolean {
    if (this.isAuthenticated()) {
      const userPerms = this.getCurrentUserPermissions();
      const ok = required.some((p) => userPerms.includes(p));

      if (ok) return true;

      this.messageService.add({
        severity: 'error',
        summary: 'Acceso denegado',
        detail: 'No tienes permisos para acceder a esta sección',
        life: 3000,
      });

      return false;
    }

    if (this.sessionExpiredVisible()) {
      return false;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
