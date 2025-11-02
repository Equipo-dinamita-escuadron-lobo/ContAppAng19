import { Department } from './../../ThirdParties/models/Department';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { environmentLocal } from '../../../../environments/environment.local';
import { EnterpriseList } from '../models/EnterpriseList';
import { EnterpriseDetails } from '../models/EnterpriseDetails';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';

@Injectable({
  providedIn: 'root',
})
export class EnterpriseService {
  private apiUrl = environmentLocal.API_URL + 'enterprises/';
  private localStorageMethods = new LocalStorageMethods();

  constructor(private http: HttpClient) {}

  /** ==================== GET EMPRESAS ==================== */
  getEnterprisesActive(): Observable<EnterpriseList[]> {
    // Devuelve empresas activas (endpoint principal)
    return this.http.get<EnterpriseList[]>(this.apiUrl);
  }

  getEnterprisesInactive(): Observable<EnterpriseList[]> {
    // Endpoint para empresas inactivas
    return this.http.get<EnterpriseList[]>(`${this.apiUrl}inactive`);
  }

  getEnterpriseById(id: string): Observable<EnterpriseDetails> {
    // Obtener empresa completa por ID
    return this.http.get<EnterpriseDetails>(`${this.apiUrl}enterprise/${id}`);
  }

  getSelectedEnterprise() {
    return this.localStorageMethods.loadEnterpriseData();
  }

  /** ==================== CRUD ==================== */
  createEnterprise(
    enterprise: EnterpriseDetails
  ): Observable<EnterpriseDetails> {
    return this.http.post<EnterpriseDetails>(this.apiUrl, enterprise);
  }

  // Actualiza todos los datos de la empresa
  updateEnterprise(
    id: string,
    enterprise: EnterpriseDetails
  ): Observable<EnterpriseDetails> {
    return this.http.put<EnterpriseDetails>(
      `${this.apiUrl}update/${id}`,
      enterprise
    );
  }

  archiveEnterprise(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}enterprise/${id}`);
  }

  unarchiveEnterprise(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}enterprise/activate/${id}`, null);
  }

  deleteEnterpriseHard(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}enterprise/hard/${id}`);
  }

  /** ==================== UTILIDADES ==================== */
  duplicateEnterprise(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}duplicate/${id}`, {});
  }

  backupEnterprise(id: string): Observable<any> {
    return this.http.post(`${this.apiUrl}backup/${id}`, {});
  }

  /** ==================== COMPARTIR EMPRESA ==================== */
  shareEnterprise(payload: { enterpriseId: number; emails: string[] }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}share`, payload);
  }

  /** ==================== Departamentos ==================== */
  // getDepartaments(): Observable<DepartmentList[]> {
  //   return this.http.get<DepartmentList[]>(this.apiUrl);
  // }
}
