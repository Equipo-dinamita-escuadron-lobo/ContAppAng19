import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionsPage } from '../Models/sessions/SessionsPage';
import { SessionAuditFilters } from '../Models/sessions/SessionAuditFilters';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuditSessionServiceService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}/api/audit/sessions`;
  //private readonly apiUrl = 'http://localhost:8080/api/audit/sessions';

  getSessions(filters: SessionAuditFilters): Observable<SessionsPage> {
    let params = new HttpParams() 
      .set('dateFrom', filters.dateFrom)
      .set('dateTo', filters.dateTo);
    
    if (filters.userName && filters.userName.trim()) {
      params = params.set('userName', filters.userName.trim());
    }

    if (filters.userRole) {
      params = params.set('userRole', filters.userRole);
    }

    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }

    if (filters.size !== undefined) {
      params = params.set('size', filters.size.toString());
    }

    if (filters.sortField) {
      params = params.set('sortField', filters.sortField);
    }

    if (filters.sortDirection) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get<SessionsPage>(this.apiUrl, { params });
  }


  exportToPdf(filters: SessionAuditFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('dateFrom', filters.dateFrom)
      .set('dateTo', filters.dateTo)
      .set('format', 'PDF');

    if (filters.userName) {
      params = params.set('userName', filters.userName);
    }

    if (filters.userRole) {
      params = params.set('userRole', filters.userRole);
    }

    return this.http.post(
      `${this.apiUrl}/export`, 
      null, 
      { params, responseType: 'blob' }
    );
  }

  exportToExcel(filters: SessionAuditFilters): Observable<Blob> {
    let params = new HttpParams()
      .set('dateFrom', filters.dateFrom)
      .set('dateTo', filters.dateTo)
      .set('format', 'EXCEL');

    if (filters.userName) {
      params = params.set('userName', filters.userName);
    }

    if (filters.userRole) {
      params = params.set('userRole', filters.userRole);
    }

    return this.http.post(
      `${this.apiUrl}/export`, 
      null, 
      { params, responseType: 'blob' }
    );
  }

}
