import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CreateFinancialStatementEmailScheduleRequest } from '../Models/Requests/CreateFinancialStatementEmailScheduleRequest';
import { ExportFinancialStatementEmailRequest } from '../Models/Requests/ExportFinancialStatementEmailRequest';
import { ExportFinancialStatementRequest } from '../Models/Requests/ExportFinancialStatementRequest';
import { UpsertFinancialStatementTemplateRequest } from '../Models/Requests/UpsertFinancialStatementTemplateRequest';
import { FinancialStatementEmailScheduleResponse } from '../Models/Responses/FinancialStatementEmailScheduleResponse';
import { FinancialStatementRegisterResponse } from '../Models/Responses/FinancialStatementResponse';
import { FinancialStatementTemplateResponse } from '../Models/Responses/FinancialStatementTemplateResponse';

@Injectable({
  providedIn: 'root',
})
export class FinancialStatementsService {
  private readonly apiUrl = `${environment.API_URL}financial-statements`;

  constructor(private readonly http: HttpClient) {}

  registerFinancialStatement(request: any): Observable<any> {
    return this.http
      .post<FinancialStatementRegisterResponse>(`${this.apiUrl}/register`, request)
      .pipe(map((response: any) => this.unwrapApiResponse(response)));
  }

  exportFinancialStatement(
    request: ExportFinancialStatementRequest
  ): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export`, request, {
      responseType: 'blob',
    });
  }

  exportFinancialStatementByEmail(
    request: ExportFinancialStatementEmailRequest
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/export/email`, request)
      .pipe(map((response: any) => this.unwrapApiResponse(response)));
  }

  createEmailSchedule(
    request: CreateFinancialStatementEmailScheduleRequest
  ): Observable<FinancialStatementEmailScheduleResponse | null> {
    return this.http
      .post<any>(`${this.apiUrl}/email-schedules`, request)
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  getEmailSchedulesByReport(
    reportId: string
  ): Observable<FinancialStatementEmailScheduleResponse[]> {
    const params = new HttpParams().set('reportId', reportId);
    return this.http.get<any>(`${this.apiUrl}/email-schedules`, { params }).pipe(
      map((response) => this.unwrapApiResponse(response) ?? [])
    );
  }

  updateEmailScheduleStatus(
    scheduleId: number,
    active: boolean
  ): Observable<FinancialStatementEmailScheduleResponse | null> {
    return this.http
      .patch<any>(`${this.apiUrl}/email-schedules/${scheduleId}/status`, {
        active,
      })
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  getHistoryByEnterprise(
    enterpriseId: string,
    pageable: any,
    search?: string
  ): Observable<any> {
    let params = new HttpParams()
      .set('enterpriseId', enterpriseId)
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get(`${this.apiUrl}/history`, { params });
  }

  getLogsByPublicId(financialStatementPublicId: string): Observable<any> {
    const params = new HttpParams().set(
      'financialStatementId',
      financialStatementPublicId
    );

    return this.http.get(`${this.apiUrl}/logs`, { params });
  }

  getFinancialStatementReport(reportId: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/${reportId}`)
      .pipe(map((response: any) => this.unwrapApiResponse(response)));
  }

  getDefaultTemplate(
    enterpriseId: string
  ): Observable<FinancialStatementTemplateResponse | null> {
    const params = new HttpParams().set('enterpriseId', enterpriseId);
    return this.http
      .get(`${this.apiUrl}/templates/default`, { params })
      .pipe(map((response: any) => this.unwrapApiResponse(response)));
  }

  upsertDefaultTemplate(
    request: UpsertFinancialStatementTemplateRequest
  ): Observable<FinancialStatementTemplateResponse | null> {
    return this.http
      .post(`${this.apiUrl}/templates/default`, request)
      .pipe(map((response: any) => this.unwrapApiResponse(response)));
  }

  private unwrapApiResponse(response: any): any {
    if (response === null || response === undefined) {
      return null;
    }

    if (response?.data !== undefined) {
      return response.data;
    }

    return response;
  }
}
