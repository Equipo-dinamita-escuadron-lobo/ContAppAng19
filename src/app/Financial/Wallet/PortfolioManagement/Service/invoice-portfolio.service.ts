import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Invoice } from '../../CashReceipts/Model';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ClientPortfolioSummary, InvoiceDetailView } from '../../Reports/Model/Response/PortfolioView';
import { ApiResponse } from '../../../../Core/Model/apiResponseModel';

@Injectable({
  providedIn: 'root'
})
export class InvoicePortfolioService {

  private apiUrl = environment.API_URL + 'payments';
  private portfolioApiUrl = environment.API_URL + 'accountCatalogue/portfolio';

  constructor(private http: HttpClient, private localStorageMethods: LocalStorageMethods) { }

  //Obtiene todas las facturas pendientes (ajusta el endpoint si es diferente)
  getPendingInvoices(): Observable<Invoice[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    const url = `${this.apiUrl}/invoices/pending/by-enterprise/${enterpriseId}`;
    return this.http.get<ApiResponse<Invoice[]>>(url).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT') {
          return [];
        }
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener facturas pendientes.');
        }
      })
    );
  }

  // Obtiene una factura por su ID (necesitarás este endpoint en el backend)
  getInvoiceById(id: number): Observable<Invoice> {
    const url = `${this.apiUrl}/invoices/${id}`;
    return this.http.get<ApiResponse<Invoice>>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || `No se encontró la factura con ID ${id}.`);
        }
      })
    );
  }

  //Obtener facturas por id de la empresa
  getInvoicesByEnterpriseId(): Observable<Invoice[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    const url = `${this.apiUrl}/invoices/by-enterprise/${enterpriseId}`;
    return this.http.get<ApiResponse<Invoice[]>>(url).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT') {
          return [];
        }
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener las facturas de la empresa.');
        }
      })
    );
  }

  // Actualiza la fecha de vencimiento
  updateDueDate(invoiceId: number, newDueDate: string): Observable<void> {
    const body = { newDueDate };
    const url = `${this.apiUrl}/${invoiceId}/due-date`;

    return this.http.patch<ApiResponse<void>>(url, body).pipe(
      map(response => {
        if (response.success) {
          return;
        } else {
          throw new Error(response.message || 'Error al actualizar la fecha de vencimiento.');
        }
      })
    );
  }

   getClientPortfolioSummary(clientIds: number[]): Observable<ClientPortfolioSummary[]> {
    const url = `${this.portfolioApiUrl}/clients-summary`;

    if (!clientIds || clientIds.length === 0) {
      return of([]);
    }

    let params = new HttpParams();
    clientIds.forEach(id => {
      params = params.append('clientIds', id.toString());
    });

    // Actualizado para usar ApiResponse y manejar NO_CONTENT
    return this.http.get<ApiResponse<ClientPortfolioSummary[]>>(url, { params }).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT' || !response.data) {
          return [];
        }
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener el resumen de cartera.');
        }
      })
    );
  }

 getInvoicesByClient(clientId: number): Observable<InvoiceDetailView[]> {
    const url = `${this.portfolioApiUrl}/invoices/by-client/${clientId}`;
    
    // Actualizado para usar ApiResponse y manejar NO_CONTENT
    return this.http.get<ApiResponse<InvoiceDetailView[]>>(url).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT' || !response.data) {
          return [];
        }
        if (response.success) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener las facturas del cliente.');
        }
      })
    );
  }

  getExpiringInvoices(enterpriseId: string, days: number = 5): Observable<Invoice[]> {
    let params = new HttpParams()
      .set('enterpriseId', enterpriseId)
      .set('days', days.toString());

    const url = `${this.apiUrl}/expiring`;
    return this.http.get<ApiResponse<Invoice[]>>(url, { params }).pipe(
      map(response => {
        if (response.code === 'NO_CONTENT') {
          return [];
        }
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.message || 'Error al obtener las facturas por vencer.');
        }
      })
    );
  }

}
