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
export class StockSyncService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Sincroniza productos en el módulo de stock
   * @param enterpriseId ID de la empresa
   * @returns Observable con la respuesta de sincronización
   */
  syncProducts(enterpriseId: string): Observable<SyncResponse> {
    return this.http.get<SyncResponse>(
      `${this.apiUrl}stock/sync/products/${enterpriseId}`
    );
  }
}
