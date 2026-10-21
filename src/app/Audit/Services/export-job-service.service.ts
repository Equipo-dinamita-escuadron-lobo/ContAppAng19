import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { interval, Observable, switchMap, takeWhile } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ExportJobResponse } from '../Models/export/ExportJobResponse';

@Injectable({
  providedIn: 'root'
})
export class ExportJobServiceService {

  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.API_URL}audit/export`

  getJobStatus(jobId: string): Observable<ExportJobResponse> {
    return this.http.get<ExportJobResponse>(`${this.baseUrl}/${jobId}/status`);
  }

  downloadFile(jobId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${jobId}/download`, {
      responseType: 'blob'
    });
  }

  removeJob(jobId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${jobId}`);
  }

  pollUntilDone(jobId: string): Observable<ExportJobResponse> {
    return interval(2000).pipe(
      switchMap(() => this.getJobStatus(jobId)),
      takeWhile(
        status => status.status !== 'COMPLETED' && status.status !== 'FAILED',
        true  
      )
    );
  }
  
}
