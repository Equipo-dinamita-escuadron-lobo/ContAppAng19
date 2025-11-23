import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SyncResponse {
  data: string;
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class KardexPepsSyncService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Sincroniza productos en el módulo de kardex con PEPS
   * @param enterpriseId ID de la empresa
   * @returns Observable con la respuesta de sincronización
   */
  syncProducts(enterpriseId: string): Observable<SyncResponse> {
    return this.http.get<SyncResponse>(
      `${this.apiUrl}kardex/peps/sync/products/${enterpriseId}`
    );
  }
}
