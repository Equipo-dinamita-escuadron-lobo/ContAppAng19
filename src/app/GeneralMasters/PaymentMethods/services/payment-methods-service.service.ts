import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMethod } from '../models/PaymentMethods';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodsServiceService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'accountCatalogue/payment-methods/';

  findAll(enterpriseId: string, page = 0, size = 10, sortField = 'name', sortOrder = 'asc'): Observable<Page<PaymentMethod>> {
    const url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`;
    return this.http.get<Page<PaymentMethod>>(url);
  }

  findById(id: number, enterpriseId: string): Observable<PaymentMethod> {
    const url = `${this.apiURL}findById/${id}/${enterpriseId}`;
    return this.http.get<PaymentMethod>(url);
  }

  create(payload: PaymentMethod): Observable<PaymentMethod> {
    const url = `${this.apiURL}create`;
    return this.http.post<PaymentMethod>(url, payload);
  }

  update(payload: PaymentMethod): Observable<PaymentMethod> {
    const url = `${this.apiURL}update`;
    return this.http.put<PaymentMethod>(url, payload);
  }

  delete(id: number, enterpriseId: string): Observable<PaymentMethod> {
    const url = `${this.apiURL}delete/${id}/${enterpriseId}`;
    return this.http.delete<PaymentMethod>(url);
  }

  changeState(id: number, enterpriseId: string, status: boolean): Observable<PaymentMethod> {
    const url = `${this.apiURL}changeState/${id}/${enterpriseId}?state=${status}`;
    return this.http.patch<PaymentMethod>(url, {});
  }
}
