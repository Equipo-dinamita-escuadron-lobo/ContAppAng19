/**
 * @fileoverview Servicio para la configuración de terceros
 *
 * Este servicio permite:
 * - Gestionar tipos de terceros
 * - Manejar tipos de identificación
 * - Realizar operaciones CRUD sobre configuraciones
 * - Gestionar peticiones HTTP relacionadas con la configuración
 *
 * Funcionalidades principales:
 * - Consulta de tipos de terceros
 * - Consulta de tipos de identificación
 * - Creación de nuevos tipos
 * - Eliminación de configuraciones
 * - Manejo de errores en las operaciones
 *
 * @author [CONTAPP]
 * @version 1.0.0
 */

import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ThirdType } from '../models/ThirdType';
import { TypeId } from '../models/TypeId';

@Injectable({
  providedIn: 'root',
})
export class ThirdPartyConfigurationServiceService {
  /** URL base para las operaciones de configuración de terceros */
  private thirdApiUrl = environment.API_URL + 'thirds/configuration/';
  //cambiar para desarrollo local
  //private thirdApiUrl = 'http://localhost:8081/api/thirds/configuration/'

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene los tipos de terceros para una empresa específica
   * @param entId ID de la empresa
   * @returns Observable con el array de tipos de terceros
   */
  getThirdTypes(entId: String): Observable<ThirdType[]> {
    let params = new HttpParams().set('entId', entId.toString());

    return this.http.get<ThirdType[]>(this.thirdApiUrl + 'thirdtype', {
      params,
    });
  }

  /**
   * Obtiene los tipos de identificación para una empresa específica
   * @param entId ID de la empresa
   * @returns Observable con el array de tipos de identificación
   */
  getTypeIds(entId: String): Observable<TypeId[]> {
    let params = new HttpParams().set('entId', entId.toString());

    return this.http.get<TypeId[]>(this.thirdApiUrl + 'typeid', { params });
  }

  /**
   * Crea un nuevo tipo de identificación
   * @param TypeId Objeto con los datos del nuevo tipo de identificación
   * @returns Observable con el tipo de identificación creado
   */
  createTypeId(TypeId: TypeId): Observable<TypeId> {
    return this.http.post<TypeId>(this.thirdApiUrl + 'typeid', TypeId).pipe(
      catchError((error) => {
        console.error('Error occurred: ', error);
        return throwError(
          () => new Error('Error occurred while adding a hero')
        );
      })
    );
  }

  /**
   * Crea un nuevo tipo de tercero
   * @param ThirdType Objeto con los datos del nuevo tipo de tercero
   * @returns Observable con el tipo de tercero creado
   */
  createThirdType(ThirdType: ThirdType): Observable<ThirdType> {
    return this.http
      .post<ThirdType>(this.thirdApiUrl + 'thirdtype', ThirdType)
      .pipe(
        catchError((error) => {
          console.error('Error occurred: ', error);
          return throwError(
            () => new Error('Error occurred while adding a hero')
          );
        })
      );
  }

  /**
   * Elimina un tercero específico
   * @param entId ID de la empresa
   * @returns Observable con la respuesta de la eliminación
   */
  deleteThird(entId: string): Observable<void> {
    return this.http.delete<void>(`${this.thirdApiUrl}${entId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error occurred: ', error);
        const errorMessage =
          error.error && error.error.text
            ? error.error.text
            : 'Error occurred while deleting the third type';
        return throwError(
          () =>
            new HttpErrorResponse({
              error: { text: errorMessage },
              status: error.status,
              statusText: error.statusText,
            })
        );
      })
    );
  }

  /**
   * Elimina un tipo de identificación específico
   * @param entId ID de la empresa
   * @returns Observable con la respuesta de la eliminación
   */
  deleteId(entId: string): Observable<void> {
    return this.http.delete<void>(`${this.thirdApiUrl}${entId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error occurred: ', error);
        const errorMessage =
          error.error && error.error.text
            ? error.error.text
            : 'Error occurred while deleting the third type';
        return throwError(
          () =>
            new HttpErrorResponse({
              error: { text: errorMessage },
              status: error.status,
              statusText: error.statusText,
            })
        );
      })
    );
  }
}
