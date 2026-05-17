import {
  HttpClient,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { DeleteFinancialStatementTemplatesRequest } from '../Models/Requests/DeleteFinancialStatementTemplatesRequest';
import {
  ExportFinancialStatementRequest,
  ReportExportFormat,
} from '../Models/Requests/ExportFinancialStatementRequest';
import { GenerateFinancialStatementRequest } from '../Models/Requests/GenerateFinancialStatementRequest';
import { UpsertFinancialStatementAnnotationRequest } from '../Models/Requests/UpsertFinancialStatementAnnotationRequest';
import { UpsertFinancialStatementTemplateRequest } from '../Models/Requests/UpsertFinancialStatementTemplateRequest';
import { ApiResponse } from '../Models/Responses/ApiResponse';
import { FinancialStatementAnnotationResponse } from '../Models/Responses/FinancialStatementAnnotationResponse';
import { FinancialStatementGenerationResultResponse } from '../Models/Responses/FinancialStatementGenerationResultResponse';
import { FinancialStatementHistoryItemResponse } from '../Models/Responses/FinancialStatementHistoryItemResponse';
import { FinancialStatementLogResponse } from '../Models/Responses/FinancialStatementLogResponse';
import { FinancialStatementRecordResponse } from '../Models/Responses/FinancialStatementRecordResponse';
import { FinancialStatementTemplateResponse } from '../Models/Responses/FinancialStatementTemplateResponse';
import { PageResult } from '../Models/Responses/PageResult';

@Injectable({
  providedIn: 'root',
})
export class FinancialStatementsService {
  private readonly apiUrl = `${environment.API_URL}financial-statements`;

  constructor(private readonly http: HttpClient) {}

  registerFinancialStatement(
    request: GenerateFinancialStatementRequest
  ): Observable<FinancialStatementGenerationResultResponse> {
    return this.http
      .post<ApiResponse<FinancialStatementGenerationResultResponse>>(
        `${this.apiUrl}/register`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  previewFinancialStatement(
    request: GenerateFinancialStatementRequest
  ): Observable<FinancialStatementGenerationResultResponse> {
    return this.http
      .post<ApiResponse<FinancialStatementGenerationResultResponse>>(
        `${this.apiUrl}/preview`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  exportFinancialStatement(
    request: ExportFinancialStatementRequest
  ): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/export`, request, {
      observe: 'response',
      responseType: 'blob',
    });
  }

  exportFinancialStatementPreview(
    request: GenerateFinancialStatementRequest,
    format: ReportExportFormat
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('format', format);
    return this.http.post(`${this.apiUrl}/preview/export`, request, {
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }

  downloadFinancialStatement(
    reportId: string,
    format: ReportExportFormat = 'PDF'
  ): Observable<HttpResponse<Blob>> {
    const params = new HttpParams().set('format', format);
    return this.http.get(`${this.apiUrl}/${reportId}/download`, {
      params,
      observe: 'response',
      responseType: 'blob',
    });
  }

  getHistoryByEnterprise(
    enterpriseId: string,
    pageable: { page: number; size: number; sort?: string }
  ): Observable<PageResult<FinancialStatementHistoryItemResponse>> {
    let params = new HttpParams()
      .set('enterpriseId', enterpriseId)
      .set('page', pageable.page.toString())
      .set('size', pageable.size.toString());

    if (pageable.sort) {
      params = params.set('sort', pageable.sort);
    }

    return this.http
      .get<ApiResponse<PageResult<FinancialStatementHistoryItemResponse>>>(
        `${this.apiUrl}/history`,
        {
          params,
        }
      )
      .pipe(
        map((response) =>
          this.unwrapApiResponse<PageResult<FinancialStatementHistoryItemResponse>>(
            response,
            {
              content: [],
              page: pageable.page,
              size: pageable.size,
              totalElements: 0,
              totalPages: 0,
            }
          )
        )
      );
  }

  getLogsByReportId(reportId: string): Observable<FinancialStatementLogResponse[]> {
    const params = new HttpParams().set('reportId', reportId);

    return this.http
      .get<ApiResponse<FinancialStatementLogResponse[]>>(`${this.apiUrl}/logs`, {
        params,
      })
      .pipe(map((response) => this.unwrapApiResponse(response, [])));
  }

  getFinancialStatementReport(
    reportId: string
  ): Observable<FinancialStatementRecordResponse> {
    return this.http
      .get<ApiResponse<FinancialStatementRecordResponse>>(`${this.apiUrl}/${reportId}`)
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  getTemplatesByEnterprise(
    enterpriseId: string
  ): Observable<FinancialStatementTemplateResponse[]> {
    const params = new HttpParams().set('enterpriseId', enterpriseId);
    return this.http
      .get<ApiResponse<FinancialStatementTemplateResponse[]>>(
        `${this.apiUrl}/templates`,
        { params }
      )
      .pipe(map((response) => this.unwrapApiResponse(response, [])));
  }

  getDefaultTemplate(
    enterpriseId: string
  ): Observable<FinancialStatementTemplateResponse | null> {
    const params = new HttpParams().set('enterpriseId', enterpriseId);
    return this.http
      .get<ApiResponse<FinancialStatementTemplateResponse>>(
        `${this.apiUrl}/templates/default`,
        { params }
      )
      .pipe(
        map((response) =>
          this.unwrapApiResponse<FinancialStatementTemplateResponse | null>(
            response,
            null
          )
        ),
        catchError((error) => {
          if (error?.status === 404) {
            return of(null);
          }

          throw error;
        })
      );
  }

  upsertTemplate(
    request: UpsertFinancialStatementTemplateRequest
  ): Observable<FinancialStatementTemplateResponse> {
    return this.http
      .post<ApiResponse<FinancialStatementTemplateResponse>>(
        `${this.apiUrl}/templates`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  upsertDefaultTemplate(
    request: UpsertFinancialStatementTemplateRequest
  ): Observable<FinancialStatementTemplateResponse> {
    return this.http
      .post<ApiResponse<FinancialStatementTemplateResponse>>(
        `${this.apiUrl}/templates/default`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  deleteTemplate(templateId: number, enterpriseId: string): Observable<number> {
    const params = new HttpParams().set('enterpriseId', enterpriseId);
    return this.http
      .delete<ApiResponse<number>>(`${this.apiUrl}/templates/${templateId}`, {
        params,
      })
      .pipe(map((response) => this.unwrapApiResponse(response, 0)));
  }

  deleteTemplates(
    request: DeleteFinancialStatementTemplatesRequest
  ): Observable<number> {
    return this.http
      .post<ApiResponse<number>>(`${this.apiUrl}/templates/delete-batch`, request)
      .pipe(map((response) => this.unwrapApiResponse(response, 0)));
  }

  deleteAllTemplates(enterpriseId: string): Observable<number> {
    const params = new HttpParams().set('enterpriseId', enterpriseId);
    return this.http
      .delete<ApiResponse<number>>(`${this.apiUrl}/templates`, { params })
      .pipe(map((response) => this.unwrapApiResponse(response, 0)));
  }

  getAnnotations(reportId: string): Observable<FinancialStatementAnnotationResponse[]> {
    return this.http
      .get<ApiResponse<FinancialStatementAnnotationResponse[]>>(
        `${this.apiUrl}/${reportId}/annotations`
      )
      .pipe(map((response) => this.unwrapApiResponse(response, [])));
  }

  createAnnotation(
    reportId: string,
    request: UpsertFinancialStatementAnnotationRequest
  ): Observable<FinancialStatementAnnotationResponse> {
    return this.http
      .post<ApiResponse<FinancialStatementAnnotationResponse>>(
        `${this.apiUrl}/${reportId}/annotations`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  updateAnnotation(
    reportId: string,
    annotationId: number,
    request: UpsertFinancialStatementAnnotationRequest
  ): Observable<FinancialStatementAnnotationResponse> {
    return this.http
      .put<ApiResponse<FinancialStatementAnnotationResponse>>(
        `${this.apiUrl}/${reportId}/annotations/${annotationId}`,
        request
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  deleteAnnotation(reportId: string, annotationId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(
        `${this.apiUrl}/${reportId}/annotations/${annotationId}`
      )
      .pipe(map((response) => this.unwrapApiResponse(response)));
  }

  private unwrapApiResponse<T>(
    response: ApiResponse<T> | T | null | undefined,
    fallbackValue?: T
  ): T {
    if (response === null || response === undefined) {
      return fallbackValue as T;
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response
    ) {
      return (response.data ?? fallbackValue) as T;
    }

    return response as T;
  }
}
