import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PaymentMethod } from '../models/PaymentMethods';

export interface PageResponse<T> {
  content: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodsServiceService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'accountCatalogue/payment-methods/';

  findAll(enterpriseId: string, page: number = 0, size: number = 10, sortField?: string, sortOrder?: string, search?: string): Observable<PageResponse<PaymentMethod>> {
    let url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}`;

    if (sortField?.trim()) {
      url += `&sortField=${sortField}`;
    }
    if (sortOrder?.trim()) {
      url += `&sortOrder=${sortOrder}`;
    }
    if (search?.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.http.get<PageResponse<PaymentMethod>>(url);
  }

  findAllActive(enterpriseId: string, page = 0, size = 10): Observable<PageResponse<PaymentMethod>> {
    const url = `${this.apiURL}findAllActive/${enterpriseId}?page=${page}&size=${size}`;
    return this.http.get<PageResponse<PaymentMethod>>(url);
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
