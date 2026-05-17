import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment.dev';
import { auxBookResponse } from '../Models/Responses/BookResponse';
import { ExportAuxiliaryBookRequest } from '../Models/Requests/ExportAuxiliaryBookRequest';

@Injectable({
  providedIn: 'root',
})
export class AuxiliaryBooksServiceService {
  private apiUrl = environment.API_URL + 'auxiliary-books'; // 👈 Ajusta la URL base si es necesario

  constructor(private http: HttpClient) {}

  /**
   * Llama al endpoint POST /register para generar un libro auxiliar
   */
  registerAuxiliaryBook(request: any): Observable<any[]> {
    return this.http
      .post<auxBookResponse>(`${this.apiUrl}/register`, request)
      .pipe(
        map((response) => response.data || []) // Extrae la propiedad 'data' y asegura que sea un array
      );
  }

  /**
   * Llama al endpoint POST /export para generar un archivo de reporte (PDF o Excel).
   * @param request El cuerpo de la solicitud con los criterios del reporte.
   * @returns Un Observable que emite el archivo como un Blob.
   */
  exportAuxiliaryBook(request: ExportAuxiliaryBookRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, request, {
      responseType: 'blob',
    });
  }

  /**
   * (NUEVO) Obtiene el historial paginado de libros auxiliares por empresa.
   * Llama al endpoint GET /history.
   * @param enterpriseId El ID de la empresa.
   * @param pageable Objeto con parámetros de paginación (page, size, sort).
   * @returns Un Observable de ResponseDTO que contiene una Page de historial.
   */
  getHistoryByEnterprise(
    enterpriseId: string,
    pageable: any // Actualizado de 'PageableParams' a 'any'
  ): Observable<any> {
    // Actualizado de 'ResponseDTO<Page<...>>' a 'any'

    let params = new HttpParams()
      .set('enterpriseId', enterpriseId)
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }

    return this.http.get<any>( // Actualizado
      `${this.apiUrl}/history`,
      { params }
    );
  }

  /**
   * (NUEVO) Obtiene los logs para un libro auxiliar específico por su ID.
   * Llama al endpoint GET /logs.
   * @param auxiliaryBookId El ID (público) del libro auxiliar.
   * @returns Un Observable de ResponseDTO que contiene una lista de logs.
   */
  getLogsByPublicId(auxiliaryBookPublicId: string): Observable<any> {
    const params = new HttpParams().set(
      'auxiliaryBookId',
      auxiliaryBookPublicId
    );

    return this.http.get<any>( // Actualizado
      `${this.apiUrl}/logs`,
      { params }
    );
  }
}
