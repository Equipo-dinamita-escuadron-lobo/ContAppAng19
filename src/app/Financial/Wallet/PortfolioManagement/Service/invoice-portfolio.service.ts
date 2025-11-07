import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Invoice } from '../../CashReceipts/Model';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ClientPortfolioSummary, InvoiceDetailView } from '../../Reports/Model/Response/PortfolioView';

@Injectable({
  providedIn: 'root'
})
export class InvoicePortfolioService {

  private apiUrl = environment.API_URL + 'payments';
  private portfolioApiUrl = environment.API_URL + 'accountCatalogue/portfolio';

  constructor(private http: HttpClient, private localStorageMethods: LocalStorageMethods) { }

  /* Obtiene todas las facturas pendientes (ajusta el endpoint si es diferente)
  getPendingInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/pending`);
  }*/

  /* Obtiene una factura por su ID (necesitarás este endpoint en el backend)*/
  getInvoiceById(id: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`);
  }

  //Obtener facturas por id de la empresa
  getInvoicesByEnterpriseId(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices/by-enterprise/${this.localStorageMethods.getIdEnterprise()}`);
  }

  // Actualiza la fecha de vencimiento
  updateDueDate(invoiceId: number, newDueDate: string): Observable<void> {
    const body = { newDueDate };
    return this.http.patch<void>(`${this.apiUrl}/${invoiceId}/due-date`, body);
  }

  getClientPortfolioSummary(clientIds: number[]): Observable<ClientPortfolioSummary[]> {
     const url = `${this.portfolioApiUrl}/clients-summary`;

    // Si no hay IDs, devolvemos un array vacío para no hacer una llamada innecesaria.
    if (!clientIds || clientIds.length === 0) {
      return of([]);
    }

    // CAMBIO CLAVE: Usamos HttpParams para construir la URL con los parámetros
    // ej: /clients-summary?clientIds=1&clientIds=2&clientIds=3
    // Spring Boot lo interpretará correctamente como una List<Long>.
    let params = new HttpParams();
    clientIds.forEach(id => {
      params = params.append('clientIds', id.toString());
    });

    // CAMBIO CLAVE: Usamos el método GET en lugar de POST.
    return this.http.get<ClientPortfolioSummary[]>(url, { params });
}

getInvoicesByClient(clientId: number): Observable<InvoiceDetailView[]> {
  const url = `${this.portfolioApiUrl}/invoices/by-client/${clientId}`;
  return this.http.get<InvoiceDetailView[]>(url);
}
}
