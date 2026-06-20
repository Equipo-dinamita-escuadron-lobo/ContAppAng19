import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../Models/User';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.API_URL + 'keycloak/';

  constructor(private http: HttpClient) {}

  // Obtener todos los usuarios con manejo de errores
  getAllUsers(): Observable<User[]> {
    // const headers = this.getAuthHeaders();
    return this.http.get<User[]>(this.apiUrl + 'users');
    //   .pipe(
    //   catchError((error) => {
    //     console.error('Error al obtener usuarios:', error);
    //     // Devuelve un array vacío de usuarios en caso de error
    //     return of([]);
    //   })
    // );
  }

  // Crear un usuario
  createUser(user: User): Observable<User> {
    if (!this.validateUser(user)) {
      throw new Error('Datos de usuario no válidos');
    }
    const headers = this.getAuthHeaders();
    return this.http.post<User>(this.apiUrl + 'create', user, { headers }).pipe(
      catchError((error) => {
        console.error('Error al crear usuario:', error);
        // Devuelve un objeto vacío con los valores por defecto para User
        return of({
          id: '',
          firstName: '',
          lastName: '',
          password: '',
          email: '',
          roles: [],
          username: '',
        });
      })
    );
  }

  // Actualizar un usuario
  updateUser(id: string, user: User): Observable<User> {
    if (!this.validateUser(user)) {
      throw new Error('Datos de usuario no válidos');
    }
    const url = `${this.apiUrl}update/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.put<User>(url, user, { headers }).pipe(
      catchError((error) => {
        console.error('Error al actualizar usuario:', error);
        // Devuelve un objeto vacío con los valores por defecto para User
        return of({
          id: '',
          firstName: '',
          lastName: '',
          password: '',
          email: '',
          roles: [],
          username: '',
        });
      })
    );
  }

  // Obtener un usuario por su ID
  getUserById(id: string): Observable<User> {
    const url = `${this.apiUrl}user/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.get<User>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error al obtener usuario:', error);
        // Devuelve un objeto vacío con los valores por defecto para User
        return of({
          id: '',
          firstName: '',
          lastName: '',
          password: '',
          email: '',
          roles: [],
          username: '',
        });
      })
    );
  }

  // Función para obtener los encabezados de autorización con JWT
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Suponiendo que el token está en localStorage
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Buscar usuario por email
  findByEmail(email: string): Observable<User[]> {
    const url = `${this.apiUrl}users?email=${email}`;
    const headers = this.getAuthHeaders();
    return this.http.get<User[]>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error al buscar usuario por email:', error);
        return of([]);
      })
    );
  }

  // Eliminar un usuario
  deleteUser(id: string): Observable<void> {
    const url = `${this.apiUrl}delete/${id}`;
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(url, { headers }).pipe(
      catchError((error) => {
        console.error('Error al eliminar usuario:', error);
        throw error;
      })
    );
  }

  // Obtener lista de roles disponibles (solo roles personalizados)
  getRoles(): Observable<string[]> {
    const url = `${this.apiUrl}roles`;
    const headers = this.getAuthHeaders();
    return this.http.get<string[]>(url, { headers }).pipe(
      map(roles => roles.filter(role => ['administrador', 'estudiante', 'profesor'].includes(role))),
      catchError((error) => {
        console.error('Error al obtener roles:', error);
        return of(['administrador', 'estudiante', 'profesor']); // Valores por defecto
      })
    );
  }

  // Validación básica del modelo de usuario
  private validateUser(user: User): boolean {
    return Boolean(
      user.firstName &&
        user.lastName &&
        user.email &&
        user.password &&
        user.roles
    );
  }
}
