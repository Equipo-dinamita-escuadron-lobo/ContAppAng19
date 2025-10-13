
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ThirdType } from '../models/ThirdType';
import { TypeId } from '../models/TypeId';

@Injectable({
  providedIn: 'root'
})
export class ThirdServiceConfigurationService {
  /** URL base para las operaciones de configuración de terceros */
  private thirdApiUrl = environment.API_URL + 'thirds/configuration/'

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
    let params = new HttpParams()
    .set('entId', entId.toString());

    return this.http.get<ThirdType[]>(this.thirdApiUrl+"thirdtype", {params}).pipe(
      map(response => {
        // Asegurar que siempre retornamos un array
        if (Array.isArray(response)) {
          return response;
        }
        // Si la respuesta es un objeto, intentar extraer el array
        if (response && typeof response === 'object') {
          // Buscar propiedades comunes que puedan contener el array
          const possibleArrays = ['content', 'data', 'items', 'results', 'thirdTypes'];
          for (const key of possibleArrays) {
            if (Array.isArray((response as any)[key])) {
              return (response as any)[key];
            }
          }
        }
        return [];
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene los tipos de identificación para una empresa específica
   * @param entId ID de la empresa
   * @returns Observable con el array de tipos de identificación
   */
  getTypeIds(entId: String): Observable<TypeId[]> {
    let params = new HttpParams()
    .set('entId', entId.toString());

    return this.http.get<TypeId[]>(this.thirdApiUrl+"typeid", {params}).pipe(
      map(response => {
        // Asegurar que siempre retornamos un array
        if (Array.isArray(response)) {
          return response;
        }
        // Si la respuesta es un objeto, intentar extraer el array
        if (response && typeof response === 'object') {
          // Buscar propiedades comunes que puedan contener el array
          const possibleArrays = ['content', 'data', 'items', 'results', 'typeIds'];
          for (const key of possibleArrays) {
            if (Array.isArray((response as any)[key])) {
              return (response as any)[key];
            }
          }
        }
        return [];
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Crea un nuevo tipo de identificación
   * @param TypeId Objeto con los datos del nuevo tipo de identificación
   * @returns Observable con el tipo de identificación creado
   */
  createTypeId(TypeId:TypeId): Observable<TypeId>{
    return this.http.post<TypeId>(this.thirdApiUrl+"typeid",TypeId).pipe(
      catchError((error) => {
        return throwError(() => new Error('Ha ocurrido un error al agregar el tipo de identificación'));
      })
    );
  }

  /**
   * Crea un nuevo tipo de tercero
   * @param ThirdType Objeto con los datos del nuevo tipo de tercero
   * @returns Observable con el tipo de tercero creado
   */
  createThirdType(ThirdType:ThirdType): Observable<ThirdType>{
    return this.http.post<ThirdType>(this.thirdApiUrl+"thirdtype",ThirdType).pipe(
      catchError((error) => {
        return throwError(() => new Error('Ha ocurrido un error al agregar el tipo de tercero'));
      })
    );
  }

  /**
   * Actualiza un tipo de tercero existente
   * @param ThirdType Objeto con los datos actualizados del tipo de tercero
   * @returns Observable con el tipo de tercero actualizado
   */
  updateThirdType(ThirdType: ThirdType): Observable<ThirdType> {
    return this.http.post<ThirdType>(this.thirdApiUrl + "thirdtype/update", ThirdType).pipe(
      catchError((error) => {
        return throwError(() => new Error('Ha ocurrido un error al actualizar el tipo de tercero'));
      })
    );
  }

  /**
   * Actualiza un tipo de identificación existente
   * @param TypeId Objeto con los datos actualizados del tipo de identificación
   * @returns Observable con el tipo de identificación actualizado
   */
  updateTypeId(TypeId: TypeId): Observable<TypeId> {
    return this.http.post<TypeId>(this.thirdApiUrl + "typeid/update", TypeId).pipe(
      catchError((error) => {
        return throwError(() => new Error('Ha ocurrido un error al actualizar el tipo de identificación'));
      })
    );
  }

  /**
   * Elimina un tipo de identificación
   * @param typeIdId ID del tipo de identificación
   * @param entId ID de la empresa
   * @returns Observable con el resultado de la eliminación
   */
  deleteTypeId(typeIdId: number, entId: string): Observable<boolean> {
    let params = new HttpParams()
      .set('typeIdId', typeIdId.toString())
      .set('entId', entId);

    return this.http.delete<boolean>(this.thirdApiUrl + "typeid/delete", { params }).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Elimina un tipo de tercero
   * @param thirdTypeId ID del tipo de tercero
   * @param entId ID de la empresa
   * @returns Observable con el resultado de la eliminación
   */
  deleteThirdType(thirdTypeId: number, entId: string): Observable<boolean> {
    let params = new HttpParams()
      .set('thirdTypeId', thirdTypeId.toString())
      .set('entId', entId);

    return this.http.delete<boolean>(this.thirdApiUrl + "thirdtype/delete", { params }).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }
}
