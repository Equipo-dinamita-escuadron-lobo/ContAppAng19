import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  registerAuxiliaryBook(request: any): Observable<auxBookResponse> {
    return this.http.post<auxBookResponse>(`${this.apiUrl}/register`, request);
  }

  /**
   * Llama al endpoint POST /export para generar un archivo de reporte (PDF o Excel).
   * @param request El cuerpo de la solicitud con los criterios del reporte.
   * @returns Un Observable que emite el archivo como un Blob.
   */
  exportAuxiliaryBook(request: ExportAuxiliaryBookRequest): Observable<Blob> {
    const format = request.format.toLowerCase();
    return this.http.post(`${this.apiUrl}/export?format=${format}`, request, {
      responseType: 'blob',
    });
  }
}
