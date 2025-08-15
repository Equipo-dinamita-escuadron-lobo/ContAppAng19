import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccountingCalendar, AccountingCalendarDateState, AccountingCalendarRangeState } from '../models/accounting-calendar.model';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingCalendarService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'config/accounting-calendar/';

  // Obtener calendario por año
  findByYear(enterpriseId: string, year: number, page = 0, size = 1000): Observable<Page<AccountingCalendar>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<AccountingCalendar>>(`${this.apiURL}findByYear/${enterpriseId}`, { params });
  }

  // Obtener calendario por rango de fechas
  findByRange(enterpriseId: string, startDate: string, endDate: string, page = 0, size = 1000): Observable<Page<AccountingCalendar>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<AccountingCalendar>>(`${this.apiURL}findByRange/${enterpriseId}`, { params });
  }

  // Cambiar estado de todas las fechas
  changeStateAll(enterpriseId: string, status: boolean): Observable<void> {
    const params = new HttpParams().set('status', status.toString());
    return this.http.post<void>(`${this.apiURL}changeState/all/${enterpriseId}`, null, { params });
  }

  // Cambiar estado de un rango de fechas
  changeStateRange(payload: AccountingCalendarRangeState): Observable<void> {
    return this.http.post<void>(`${this.apiURL}changeState/range`, payload);
  }

  // Cambiar estado de una fecha específica
  changeDateState(payload: AccountingCalendarDateState): Observable<void> {
    // Como no hay endpoint específico para una fecha, usaremos el de rango con la misma fecha
    const rangePayload: AccountingCalendarRangeState = {
      idEnterprise: payload.idEnterprise,
      startDate: payload.date,
      endDate: payload.date,
      status: payload.status
    };
    return this.changeStateRange(rangePayload);
  }
}
