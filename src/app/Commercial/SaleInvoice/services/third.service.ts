import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  /**
   * Obtiene la lista completa de terceros de una empresa
   * @param entId ID de la empresa
   * @returns Observable con la lista de terceros
   */
  getThirdList(entId: String): Observable<Third[]> {
    let params = new HttpParams()
    .set('entId', entId.toString());
    return this.http.get<any>(API_URL+"list", {params})
  }
}
