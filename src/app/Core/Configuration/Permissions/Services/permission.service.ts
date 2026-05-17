import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AssignPermissionRequest,
  Permission,
  RolesWithPermissions,
} from '../Models/Permission';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService {
  private apiUrl = environment.API_URL + 'keycloak/permissions';

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los permisos disponibles en Keycloak
   */
  findAllPermissions(): Observable<Permission[]> {
    return this.http.get<string[]>(`${this.apiUrl}/findAll`).pipe(
      map(
        (permissions) => permissions.map((p) => ({ name: p })) // transformamos a { name: string }
      )
    );
  }

  /**
   * Asignar un rol a múltiples permisos
   */
  addPolicyToPermissions(request: AssignPermissionRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}/assignRoleToPermissions`, request, {
      responseType: 'text',
    });
  }

  updatePermissions(request: AssignPermissionRequest): Observable<string> {
    return this.http.put(`${this.apiUrl}/updatePermissionsForRole`, request, {
      responseType: 'text',
    });
  }

  /**
   * Obtener todos los roles con sus permisos asignados
   */
  getRolesWithPermissions(): Observable<RolesWithPermissions[]> {
    return this.http
      .get<Record<string, string[]>>(`${this.apiUrl}/rolesWithPermissions`)
      .pipe(
        map((response) =>
          Object.entries(response).map(([role, permissions]) => ({
            role,
            permissions: permissions.map((p) => ({ name: p })),
          }))
        )
      );
  }
}
