import { Tax } from './../../Taxes/models/Tax';
import { NoCommercialTagResponse } from './../Models/NoCommercialTagResponse';
import { Enterprise } from './../../Enterprise/models/enterprise';
import { catchError, Observable, throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { NoCommercialTagRequest } from '../Models/NoCommercialTagRequest';
import { NoCommercialTagUpdateRequest } from '../Models/NoCommercialTagUpdateRequest';
import { EntData, LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { EnterpriseService } from '../../Enterprise/services/enterprise.service';
import { NoCommercialTag } from '../Models/NoCommercialTag';


@Injectable({
  providedIn: 'root'
})
export class NoCommercialTagService {

  private readonly apiUrl = `${environment.API_URL}api/config/tag`;
  private readonly localStorageMethods = new LocalStorageMethods();
  private readonly entData: EntData | null = this.localStorageMethods.loadEnterpriseData();
  private readonly enterpriseId: string;

  constructor(private readonly http: HttpClient) {
    this.enterpriseId = this.getEnterpriseIdFromLocalStorage();
  }

  /**
   * Crea un nuevo tag
   */
  createTag(tag: NoCommercialTagRequest): Observable<NoCommercialTagResponse> {
    const tagWithEnterpriseId = {
      ...tag,
      enterpriseId: this.enterpriseId
    };

    return this.http
      .post<NoCommercialTagResponse>(`${this.apiUrl}/create`, tagWithEnterpriseId)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Actualiza un tag existente
   */
  updateTag(tagId: number, tag: NoCommercialTagUpdateRequest): Observable<NoCommercialTagResponse> {
    const url = `${this.apiUrl}/update/${tagId}`;
    
    return this.http
      .put<NoCommercialTagResponse>(url, tag)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene un tag por ID
   */
  getTagById(tagId: number): Observable<NoCommercialTagResponse> {
    const url = `${this.apiUrl}/enterprise/${this.enterpriseId}/tag/${tagId}`;
    
    return this.http
      .get<NoCommercialTagResponse>(url)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene todos los tags de una empresa
   * @param enterpriseId - ID de la empresa (opcional, usa el del localStorage por defecto)
   */
  getAllTags(enterpriseId?: string): Observable<NoCommercialTagResponse[]> {
    const targetEnterpriseId = enterpriseId || this.enterpriseId;
    const url = `${this.apiUrl}/tags/${targetEnterpriseId}`;
    
    return this.http
      .get<NoCommercialTagResponse[]>(url)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Elimina un tag por ID
   */
  deleteTag(tagId: number): Observable<void> {
    const url = `${this.apiUrl}/deletetag/${tagId}`;
    
    return this.http
      .delete<void>(url)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Obtiene el ID de empresa desde localStorage
   * @private
   */
  private getEnterpriseIdFromLocalStorage(): string {
    if (!this.entData?.id) {
      throw new Error('Enterprise data not found in local storage');
    }
    return this.entData.id;
  }

  /**
   * Maneja errores HTTP
   * @private
   */
  private handleError(error: any): Observable<never> {
    console.error('HTTP Error in NoCommercialTagService:', error);
    
    // Personalizar mensajes de error según el código HTTP
    let errorMessage = 'An error occurred while processing the request';
    
    if (error.status === 404) {
      errorMessage = 'Tag not found';
    } else if (error.status === 400) {
      errorMessage = 'Invalid request data';
    } else if (error.status === 500) {
      errorMessage = 'Server error occurred';
    }
    
    return throwError(() => new Error(errorMessage));
  }

}
