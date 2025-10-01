import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentType } from '../models/DocumentTypes';
import { DocumentModule } from '../models/DocumentModule';

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
export class DocumentTypesServiceService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'config/document-types/';

  findAll(enterpriseId: string, page = 0, size = 10, sortField = 'name', sortOrder = 'asc'): Observable<Page<DocumentType>> {
    const url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`;
    return this.http.get<Page<DocumentType>>(url);
  }

  findById(id: number, enterpriseId: string): Observable<DocumentType> {
    const url = `${this.apiURL}findById/${id}/${enterpriseId}`;
    return this.http.get<DocumentType>(url);
  }

  create(payload: DocumentType): Observable<DocumentType> {
    const url = `${this.apiURL}create`;
    return this.http.post<DocumentType>(url, payload);
  }

  update(payload: DocumentType): Observable<DocumentType> {
    const url = `${this.apiURL}update`;
    return this.http.put<DocumentType>(url, payload);
  }

  delete(id: number, enterpriseId: string): Observable<void> {
    const url = `${this.apiURL}delete/${id}/${enterpriseId}`;
    return this.http.delete<void>(url);
  }

  changeState(id: number, enterpriseId: string, status: boolean): Observable<any> {
    const url = `${this.apiURL}changeState/${id}/${enterpriseId}?status=${status}`;
    return this.http.patch<any>(url, {});
  }

  getAllModules(): Observable<DocumentModule[]> {
    const url = `${this.apiURL}modules`;
    return this.http.get<DocumentModule[]>(url);
  }
}
