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
  private readonly apiURL = environment.API_URL + 'config/document-classes/';

  findAll(enterpriseId: string, page = 0, size = 1000): Observable<DocumentClass[]> {
    const url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}`;
    return this.http.get<any>(url);
  }
}
