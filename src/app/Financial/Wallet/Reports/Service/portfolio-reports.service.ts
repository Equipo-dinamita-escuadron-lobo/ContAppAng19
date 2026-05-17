import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PortfolioAgingAccount } from '../Model/Response/PortfolioAgingAccount';
import { map, Observable, of } from 'rxjs';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ApiResponse } from '../../../../Core/Model/apiResponseModel';

@Injectable({
  providedIn: 'root'
})
export class PortfolioReportsService {

  private portfolioApiUrl = environment.API_URL + 'accountCatalogue/portfolio';

  constructor(
    private http: HttpClient,
    private localStorageMethods: LocalStorageMethods
  ) { }

  /**
   * Obtiene el reporte de vencimiento por edades para un cliente específico.
   * @param clientId El ID del cliente.
   * @param cutoffDate La fecha de corte para calcular la antigüedad de la deuda.
   * @returns Un Observable con los datos jerárquicos del reporte.
   */
  getPortfolioAgingReport(clientId: number | null, cutoffDate: Date, includeDocuments: boolean): Observable<PortfolioAgingAccount[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    const url = `${this.portfolioApiUrl}/aging-report`;

    if (!enterpriseId) {
      console.error("ID de empresa no encontrado");
      return of([]);
    }

    // Formatear la fecha a YYYY-MM-DD
    const formattedCutoffDate = cutoffDate.toISOString().split('T')[0];

    let params = new HttpParams()
      .set('cutoffDate', formattedCutoffDate)
      .set('enterpriseId', enterpriseId);

    if (clientId !== null) {
      params = params.append('clientId', clientId.toString());
    }

    if (includeDocuments) {
      params = params.append('includeDocuments', 'true');
    }

    // Actualizado para usar ApiResponse y manejar NO_CONTENT
    return this.http.get<ApiResponse<PortfolioAgingAccount[]>>(url, { params }).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT' || !response.data) {
          return [];
        }
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener el reporte de antigüedad.');
        }
      })
    );
  }
}
