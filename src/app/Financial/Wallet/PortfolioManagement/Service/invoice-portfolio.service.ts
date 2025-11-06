import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Invoice } from '../../CashReceipts/Model';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Injectable({
  providedIn: 'root'
})
export class InvoicePortfolioService {

  private apiUrl = environment.API_URL + 'payments';

  constructor(private http: HttpClient, private localStorageMethods: LocalStorageMethods) { }

  //Obtiene todas las facturas pendientes (ajusta el endpoint si es diferente)
  getPendingInvoices(): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/invoices/pending/by-enterprise/${this.localStorageMethods.getIdEnterprise()}`);
  }

  // Obtiene una factura por su ID (necesitarás este endpoint en el backend)
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
}
