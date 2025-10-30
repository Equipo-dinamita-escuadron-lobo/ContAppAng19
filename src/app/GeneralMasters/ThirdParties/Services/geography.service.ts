import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Country } from '../models/Country';
import { Department } from '../models/Department';
import { City } from '../models/City';

/**
 * Servicio para gestionar información geográfica (países, departamentos/estados y ciudades)
 * Consume los endpoints del microservicio thirds-management
 */
@Injectable({
  providedIn: 'root'
})
export class GeographyService {
  /** URL base de la API de geografía */
  private readonly baseUrl = `${environment.API_URL}thirds/geography`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene todos los países activos
   * @returns Observable con la lista de países ordenados por nombre
   */
  getAllCountries(): Observable<Country[]> {
    const url = `${this.baseUrl}/countries`;
    
    return this.http.get<Country[]>(url).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene todos los estados/departamentos activos de un país específico
   * @param countryCode Código del país (ejemplo: 'COL' para Colombia)
   * @returns Observable con la lista de estados ordenados por nombre
   */
  getStatesByCountry(countryCode: string): Observable<Department[]> {
    const params = new HttpParams().set('countryCode', countryCode);
    const url = `${this.baseUrl}/states`;
    
    return this.http.get<Department[]>(url, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene todas las ciudades activas de un estado específico
   * @param stateCode Código del estado/departamento
   * @param countryCode Código del país
   * @returns Observable con la lista de ciudades ordenadas por nombre
   */
  getCitiesByState(stateCode: string, countryCode: string): Observable<City[]> {
    const params = new HttpParams()
      .set('stateCode', stateCode)
      .set('countryCode', countryCode);
    const url = `${this.baseUrl}/cities`;
    
    return this.http.get<City[]>(url, { params }).pipe(
      catchError(error => {
        return throwError(() => error);
      })
    );
  }
}
