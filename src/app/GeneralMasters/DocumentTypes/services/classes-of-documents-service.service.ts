import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DocumentClass } from '../models/ClassesOfDocuments';

@Injectable({
  providedIn: 'root'
})
export class ClassesOfDocumentsServiceService {
  private readonly http = inject(HttpClient);
  readonly apiURL = environment.API_URL + 'config/document-classes/';

  findAll(enterpriseId: string, page = 0, size = 1000): Observable<any> {
    const url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}`;
    return this.http.get<any>(url);
  }

  findAllActive(enterpriseId: string): Observable<any> {
    const url = `${this.apiURL}findAllActive/${enterpriseId}`;
    return this.http.get<any>(url);
  }

  delete(id: number, enterpriseId: string): Observable<void> {
    const url = `${this.apiURL}delete/${id}/${enterpriseId}`;
    return this.http.delete<void>(url);
  }

  create(name: string, enterpriseId: string): Observable<any> {
    const url = `${this.apiURL}create`;
    return this.http.post<any>(url, { idEnterprise: enterpriseId, name });
  }

  changeState(id: number, enterpriseId: string, status: boolean): Observable<any> {
    const url = `${this.apiURL}changeState/${id}/${enterpriseId}?status=${status}`;
    return this.http.patch<any>(url, {});
  }
}
