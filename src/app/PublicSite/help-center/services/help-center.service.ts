import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HelpCenterResponse } from '../models/HelpCenterResponse';

let API_URL = environment.API_URL + 'config/help-center/';

@Injectable({
  providedIn: 'root'
})
export class HelpCenterService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los registros de ayuda filtrados por módulo
   */
  findAllByModule(enterpriseId: string, moduleId: number): Observable<HelpCenterResponse[]> {
    let params = new HttpParams()
      .set('moduleId', moduleId.toString());

    return this.http.get<HelpCenterResponse[]>(
      `${this.apiUrl}findAllByModule/${enterpriseId}`,
      { params }
    );
  }

  /**
   * Busca registros de ayuda por término de búsqueda
   * Utiliza el endpoint findAll con paginación flexible y parámetro search
   */
  searchHelps(enterpriseId: string, searchTerm: string): Observable<any> {
    let params = new HttpParams();
    
    if (searchTerm && searchTerm.trim()) {
      params = params.set('search', searchTerm.trim());
    }

    return this.http.get<any>(
      `${this.apiUrl}findAll/${enterpriseId}`,
      { params }
    );
  }

  /**
   * Obtiene un registro de ayuda por ID
   */
  findById(id: number, enterpriseId: string): Observable<HelpCenterResponse> {
    return this.http.get<HelpCenterResponse>(
      `${this.apiUrl}findById/${id}/${enterpriseId}`
    );
  }
}
