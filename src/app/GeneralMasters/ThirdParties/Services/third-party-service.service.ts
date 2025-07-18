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
import { catchError, map, Observable, throwError } from 'rxjs';
import { Third } from '../models/Third';

@Injectable({
  providedIn: 'root',
})
export class ThirdPartyServiceService {
  /** Almacena información del RUT del tercero */
  private infoThirdRUT: string | null = null;

  /** URL base para las operaciones con terceros */
  private thirdApiUrl = environment.API_URL + 'thirds/';
  //Cambiar para desarrollo local
  //private thirdApiUrl = 'http://localhost:8081/api/thirds/'

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   */
  constructor(private http: HttpClient) {}

  /**
   * Establece la información del RUT
   * @param info Información del RUT a almacenar
   */
  setInfoThirdRUT(info: string): void {
    this.infoThirdRUT = info;
  }

  /**
   * Obtiene la información almacenada del RUT
   * @returns Información del RUT o null si no existe
   */
  getInfoThirdRUT(): string | null {
    return this.infoThirdRUT;
  }

  /**
   * Limpia la información almacenada del RUT
   */
  clearInfoThirdRUT(): void {
    this.infoThirdRUT = null;
  }

  /**
   * Crea un nuevo tercero en el sistema
   * @param Third Datos del tercero a crear
   * @returns Observable con el tercero creado
   */
  createThird(Third: Third): Observable<Third> {
    console.log('Request Body:', Third);
    return this.http.post<Third>(this.thirdApiUrl, Third).pipe(
      catchError((error) => {
        console.error('Error occurred: ', error);
        return throwError(
          () => new Error('Error occurred while adding a Third Party')
        );
      })
    );
  }

  /**
   * Extrae información del PDF del RUT
   * @param file Archivo PDF del RUT
   * @returns Observable con la información extraída
   */
  ExtractInfoPDFRUT(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    console.log('Request Body:', formData);
    return this.http
      .post<any>(this.thirdApiUrl + 'content-PDF-RUT', formData)
      .pipe(
        catchError((error) => {
          console.error('Error occurred: ', error);
          return throwError(
            () => new Error('Error occurred while uploading the file')
          );
        })
      );
  }

  /**
   * Actualiza la información de un tercero existente
   * @param Third Datos actualizados del tercero
   * @returns Observable con el tercero actualizado
   */
  UpdateThird(Third: object): Observable<Third> {
    console.log('Request Body:', Third);
    return this.http.post<Third>(this.thirdApiUrl + 'update', Third).pipe(
      catchError((error) => {
        console.error('Error occurred: ', error);
        return throwError(
          () => new Error('Error occurred while adding a hero')
        );
      })
    );
  }

  /**
   * Obtiene la lista paginada de terceros
   * @param entId ID de la empresa
   * @param numPage Número de página
   * @returns Observable con la lista de terceros
   */
  getThirdParties(entId: String, numPage: number): Observable<Third[]> {
    let params = new HttpParams()
      .set('entId', entId.toString())
      .set('numPage', numPage);
    return this.http
      .get<any>(this.thirdApiUrl, { params })
      .pipe(map((response) => response.content as Third[]));
  }

  /**
   * Obtiene la lista completa de terceros de una empresa
   * @param entId ID de la empresa
   * @returns Observable con la lista de terceros
   */
  getThirdList(entId: String): Observable<Third[]> {
    let params = new HttpParams().set('entId', entId.toString());
    return this.http.get<any>(this.thirdApiUrl + 'list', { params });
  }

  /**
   * Obtiene un tercero específico por su ID
   * @param thId ID del tercero
   * @returns Observable con los datos del tercero
   */
  getThirdPartie(thId: number): Observable<Third> {
    return this.http.get<any>(this.thirdApiUrl + `third?thId=${thId}`);
  }

  /**
   * Verifica si existe un tercero con el ID y empresa especificados
   * @param thId ID del tercero
   * @param entId ID de la empresa
   * @returns Observable con el resultado de la verificación
   */
  existThird(thId: number, entId: String): Observable<boolean> {
    return this.http.get<boolean>(
      `${this.thirdApiUrl}existBy?idNumber=${thId}&entId=${entId}`
    );
  }

  /**
   * Cambia el estado de un tercero
   * @param thId ID del tercero
   * @returns Observable con el resultado del cambio de estado
   */
  changeThirdPartieState(thId: number): Observable<Boolean> {
    let params = new HttpParams().set('thId', thId);
    return this.http.put<any>(this.thirdApiUrl, null, { params });
  }
}
