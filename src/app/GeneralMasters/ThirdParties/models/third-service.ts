
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Third } from '../models/third-model';

@Injectable({
  providedIn: 'root'
})
export class ThirdService {
  
  private apiUrl = 'assets/data/thirds-parties/thirds-parties.json';

  /**
   * Constructor del servicio
   * @param http Cliente HTTP para realizar peticiones
   */
  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de terceros
   * @returns Observable con el array de terceros
   */
  getThirdParties(): Observable<Third[]> {
    return this.http.get<Third[]>(this.apiUrl);
  }

}
