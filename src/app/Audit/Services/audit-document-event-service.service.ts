import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LocalStorageMethods } from '../../Shared/Methods/local-storage.method';
import { environment } from '../../../environments/environment';
import { DocumentEventFilters } from '../Models/documents/DocumentEventFilters';
import { PageResponse } from '../Models/common/PageResponse';
import { DocumentEventAudit } from '../Models/documents/DocumentEventAudit';
import { DocumentEventDetail } from '../Models/documents/DocumentEventDetail';
import { DocumentExportFilters } from '../Models/export/DocumentExportFiters';
import { AuditDocumentsState } from '../Models/documents/AuditDocumentState';

@Injectable({
  providedIn: 'root'
})
export class AuditDocumentEventServiceService {

  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.API_URL}audit/documents`;
  private readonly exportUrl = `${environment.API_URL}audit/documents/export`;

  constructor(private localStorageMethods: LocalStorageMethods) {}

  getDocumentsEvents(filters: DocumentEventFilters): Observable<PageResponse<DocumentEventAudit>> {
    let params = new HttpParams()
      .set('enterpriseId', this.localStorageMethods.getIdEnterprise())
      .set('dateFrom', filters.dateFrom)
      .set('dateTo', filters.dateTo);

      if (filters.dateType)
        params = params.set('dateType', filters.dateType);
      if (filters.documentType)
        params = params.set('documentType', filters.documentType);
      if (filters.documentCode)
        params = params.set('documentCode', filters.documentCode);
      if (filters.thirdPartyName)
        params = params.set('thirdPartyName', filters.thirdPartyName);
      if (filters.createdBy)
        params = params.set('createdBy', filters.createdBy);
      if (filters.page !== undefined)
        params = params.set('page', filters.page.toString());
      if (filters.size !== undefined)
        params = params.set('size', filters.size.toString());
      if (filters.sortField)
        params = params.set('sortField', filters.sortField);
      if (filters.sortDirection)
        params = params.set('sortDirection', filters.sortDirection);

    return this.http.get<PageResponse<DocumentEventAudit>>(this.apiUrl, { params });
  }

  getDocumentsEventsDetails(documentCode: string): Observable<DocumentEventDetail[]> {
    const params = new HttpParams().set('enterpriseId', this.localStorageMethods.getIdEnterprise());
    return this.http.get<DocumentEventDetail[]>(
      `${this.apiUrl}/${documentCode}/details`,
      { params }
    );
  }

  initiateExport(filters: DocumentExportFilters): Observable<{ jobId: string }> {
    const body = {
      enterpriseId: this.localStorageMethods.getIdEnterprise(),
      enterpriseName: this.localStorageMethods.getEnterpriseName(),
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      documentCode: filters.documentCode || undefined,
      documentType: filters.documentType || undefined,
      thirdPartyName: filters.thirdPartyName || undefined,
      operationType: filters.operationType || undefined,
      userName: filters.userName || undefined,
      exportFormat: 'EXCEL'
    };
    return this.http.post<{ jobId: string }>(this.exportUrl, body);
  }

  private auditDocumentsState: AuditDocumentsState | null = null;

  setAuditDocumentsState(state: AuditDocumentsState): void {
    this.auditDocumentsState = state;
  }

  getAuditDocumentsState(): AuditDocumentsState | null {
    return this.auditDocumentsState;
  }

  clearAuditDocumentsState(): void {
    this.auditDocumentsState = null;
  }
}
