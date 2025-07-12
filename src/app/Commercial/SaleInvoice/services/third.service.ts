import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Third } from '../../../GeneralMasters/ThirdParties/models/Third';

let API_URL = environment.API_URL + 'thirds/';

@Injectable({
  providedIn: 'root'
})
export class ThirdService {

  constructor(private http: HttpClient) { }

  /**
   * Obtiene un tercero específico por su ID
   * @param thId ID del tercero
   * @returns Observable con los datos del tercero
   */
  getThirdPartie(thId:number): Observable<Third>{
    return this.http.get<any>(API_URL+`third?thId=${thId}`)
  }
}
