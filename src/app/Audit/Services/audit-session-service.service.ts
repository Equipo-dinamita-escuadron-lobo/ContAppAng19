import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SessionAuditFilters } from '../Models/sessions/SessionAuditFilters';
import { environment } from '../../../environments/environment';
import { PageResponse } from '../Models/common/PageResponse';
import { SessionAudit } from '../Models/sessions/SessionAudit';
import { ExportSessionFilters } from '../Models/export/ExportSessionFilters';

@Injectable({
  providedIn: 'root'
})
export class AuditSessionServiceService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}audit/sessions`;

  private readonly exportUrl = `${environment.API_URL}audit/sessions/export`;

  getSessions(filters: SessionAuditFilters): Observable<PageResponse<SessionAudit>> {
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

    return this.http.get<PageResponse<SessionAudit>>(this.apiUrl, { params });
  }

  initiateExport(filters: ExportSessionFilters): Observable<{ jobId: string }> {
      const body = {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        userName: filters.userName ?? null,
        userRole: filters.userRole ?? null,
        exportFormat: filters.exportFormat ?? 'EXCEL'
      };
      return this.http.post<{ jobId: string }>(this.exportUrl, body);
  }

}
