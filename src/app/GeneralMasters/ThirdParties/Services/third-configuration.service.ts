
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ThirdType } from '../models/ThirdType';
import { TypeId } from '../models/TypeId';

@Injectable({
  providedIn: 'root'
})
export class ThirdServiceConfigurationService {
  /** URL base para las operaciones de configuración de terceros */
  private thirdApiUrl = environment.API_URL + 'thirds/configuration/';

  /**
   * Método genérico para extraer arrays de respuestas que pueden venir en diferentes formatos
   * @param response Respuesta del backend
   * @param possibleKeys Claves posibles donde puede estar el array
   * @returns Array extraído o array vacío
   */
  private extractArrayFromResponse<T>(response: any, possibleKeys: string[] = []): T[] {
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && typeof response === 'object') {
      for (const key of possibleKeys) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    
    return [];
  }

  /**
   * Método genérico para manejar errores en operaciones POST
   * @param operation Nombre de la operación para el mensaje de error
   * @returns Operador de manejo de errores
   */
  private handlePostError<T>(operation: string) {
    return catchError<T, Observable<T>>((error: any) => 
      throwError(() => new Error(`Ha ocurrido un error al ${operation}`))
    );
  }

  /**
   * Método genérico para crear parámetros HTTP
   * @param params Objeto con los parámetros
   * @returns HttpParams configurado
   */
  private buildHttpParams(params: { [key: string]: string | number }): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      httpParams = httpParams.set(key, params[key].toString());
    });
    return httpParams;
  }

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   */
  constructor(private http: HttpClient) { }

  /**
   * Obtiene los tipos de terceros para una empresa específica
   * @param entId ID de la empresa
   * @returns Observable con el array de tipos de terceros
   */
  getThirdTypes(entId: String): Observable<ThirdType[]> {
    const params = new HttpParams().set('entId', entId.toString());
    const possibleKeys = ['content', 'data', 'items', 'results', 'thirdTypes'];

    return this.http.get<ThirdType[]>(this.thirdApiUrl + "thirdtype", {params}).pipe(
      map(response => this.extractArrayFromResponse<ThirdType>(response, possibleKeys)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Obtiene los tipos de identificación para una empresa específica
   * @param entId ID de la empresa
   * @returns Observable con el array de tipos de identificación
   */
  getTypeIds(entId: String): Observable<TypeId[]> {
    const params = new HttpParams().set('entId', entId.toString());
    const possibleKeys = ['content', 'data', 'items', 'results', 'typeIds'];

    return this.http.get<TypeId[]>(this.thirdApiUrl + "typeid", {params}).pipe(
      map(response => this.extractArrayFromResponse<TypeId>(response, possibleKeys)),
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Crea un nuevo tipo de identificación
   * @param TypeId Objeto con los datos del nuevo tipo de identificación
   * @returns Observable con el tipo de identificación creado
   */
  createTypeId(TypeId: TypeId): Observable<TypeId> {
    return this.http.post<TypeId>(this.thirdApiUrl + "typeid", TypeId).pipe(
      this.handlePostError('agregar el tipo de identificación')
    );
  }

  /**
   * Crea un nuevo tipo de tercero
   * @param ThirdType Objeto con los datos del nuevo tipo de tercero
   * @returns Observable con el tipo de tercero creado
   */
  createThirdType(ThirdType: ThirdType): Observable<ThirdType> {
    return this.http.post<ThirdType>(this.thirdApiUrl + "thirdtype", ThirdType).pipe(
      this.handlePostError('agregar el tipo de tercero')
    );
  }

  /**
   * Actualiza un tipo de tercero existente
   * @param ThirdType Objeto con los datos actualizados del tipo de tercero
   * @returns Observable con el tipo de tercero actualizado
   */
  updateThirdType(ThirdType: ThirdType): Observable<ThirdType> {
    return this.http.post<ThirdType>(this.thirdApiUrl + "thirdtype/update", ThirdType).pipe(
      this.handlePostError('actualizar el tipo de tercero')
    );
  }

  /**
   * Actualiza un tipo de identificación existente
   * @param TypeId Objeto con los datos actualizados del tipo de identificación
   * @returns Observable con el tipo de identificación actualizado
   */
  updateTypeId(TypeId: TypeId): Observable<TypeId> {
    return this.http.post<TypeId>(this.thirdApiUrl + "typeid/update", TypeId).pipe(
      this.handlePostError('actualizar el tipo de identificación')
    );
  }

  /**
   * Elimina un tipo de identificación
   * @param typeIdId ID del tipo de identificación
   * @param entId ID de la empresa
   * @returns Observable con el resultado de la eliminación
   */
  deleteTypeId(typeIdId: number, entId: string): Observable<boolean> {
    const params = this.buildHttpParams({ typeIdId, entId });
    return this.http.delete<boolean>(this.thirdApiUrl + "typeid/delete", { params }).pipe(
      catchError((error) => throwError(() => error))
    );
  }

  /**
   * Elimina un tipo de tercero
   * @param thirdTypeId ID del tipo de tercero
   * @param entId ID de la empresa
   * @returns Observable con el resultado de la eliminación
   */
  deleteThirdType(thirdTypeId: number, entId: string): Observable<boolean> {
    const params = this.buildHttpParams({ thirdTypeId, entId });
    return this.http.delete<boolean>(this.thirdApiUrl + "thirdtype/delete", { params }).pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
