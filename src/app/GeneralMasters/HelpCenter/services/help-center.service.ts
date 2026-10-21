import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HelpCenter } from '../models/HelpCenter';

interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class HelpCenterServiceService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'config/help-center/';

  findAll(page = 0, size = 10, sortField = 'name', sortOrder = 'asc', search = ''): Observable<Page<HelpCenter>> {
    let url = `${this.apiURL}findAll?page=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<Page<HelpCenter>>(url);
  }

  findById(id: number): Observable<HelpCenter> {
    const url = `${this.apiURL}findById/${id}`;
    return this.http.get<HelpCenter>(url);
  }

  create(payload: HelpCenter): Observable<HelpCenter> {
    const url = `${this.apiURL}create`;
    return this.http.post<HelpCenter>(url, payload);
  }

  update(payload: HelpCenter): Observable<HelpCenter> {
    const url = `${this.apiURL}update`;
    return this.http.put<HelpCenter>(url, payload);
  }

  delete(id: number): Observable<void> {
    const url = `${this.apiURL}delete/${id}`;
    return this.http.delete<void>(url);
  }

  changeState(id: number, status: boolean): Observable<any> {
    const url = `${this.apiURL}changeState/${id}?status=${status}`;
    return this.http.patch<any>(url, {});
  }

  findAllByModule(moduleId: number): Observable<HelpCenter[]> {
    const url = `${this.apiURL}findAllByModule?moduleId=${moduleId}`;
    return this.http.get<HelpCenter[]>(url);
  }

  getModules(): Observable<any[]> {
    const url = `${this.apiURL}modules`;
    return this.http.get<any[]>(url);
  }
}