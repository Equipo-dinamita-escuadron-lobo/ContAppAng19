import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { GenerateAuxiliaryBookRequest } from '../Models/GenerateAuxiliaryBookRequest';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment.local';
import { auxBookResponse } from '../Models/Response';

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
}
