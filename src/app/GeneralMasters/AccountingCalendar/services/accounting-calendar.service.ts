import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  AccountingCalendar, 
  AccountingCalendarCreateMonthReq,
  AccountingCalendarDeleteMonthReq,
  AccountingCalendarCreateYearReq,
  AccountingCalendarDeleteYearReq
} from '../models/accounting-calendar.model';

@Injectable({
  providedIn: 'root'
})
export class AccountingCalendarService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'config/accounting-calendar/';

  // ========== MÉTODOS PRINCIPALES ==========

  /**
   * Crea un nuevo registro en el calendario contable (fecha individual)
   * @param payload Datos para crear el calendario
   */
  create(payload: any): Observable<AccountingCalendar> {
    return this.http.post<AccountingCalendar>(`${this.apiURL}create`, payload);
  }

  /**
   * Elimina un registro del calendario contable
   * @param id ID del registro a eliminar
   * @param enterpriseId ID de la empresa
   */
  delete(id: number, enterpriseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete/${id}/${enterpriseId}`);
  }

  /**
   * Abre/cierra un mes completo en el calendario contable
   * @param request Datos para abrir/cerrar el mes
   */
  openMonth(request: AccountingCalendarCreateMonthReq): Observable<AccountingCalendar[]> {
    return this.http.post<AccountingCalendar[]>(`${this.apiURL}open-month`, request);
  }

  /**
   * Elimina un mes completo del calendario contable
   * @param request Datos para eliminar el mes
   */
  deleteByMonth(request: AccountingCalendarDeleteMonthReq): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete-month`, { body: request });
  }

  // ========== MÉTODOS POR AÑO ==========

  /**
   * Abre/cierra un año completo en el calendario contable
   * @param request Datos para abrir/cerrar el año
   */
  openYear(request: AccountingCalendarCreateYearReq): Observable<AccountingCalendar[]> {
    return this.http.post<AccountingCalendar[]>(`${this.apiURL}open-year`, request);
  }

  /**
   * Elimina un año completo del calendario contable
   * @param request Datos para eliminar el año
   */
  deleteByYear(request: AccountingCalendarDeleteYearReq): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete-year`, { body: request });
  }

  // ========== MÉTODOS DE CONSULTA ==========

  /**
   * Obtiene todas las fechas creadas por empresa y año
   * @param enterpriseId ID de la empresa
   * @param year Año del calendario
   */
  findAllByYear(enterpriseId: string, year: number): Observable<AccountingCalendar[]> {
    const params = new HttpParams().set('year', year.toString());
    return this.http.get<AccountingCalendar[]>(`${this.apiURL}year/${enterpriseId}`, { params }).pipe(
      map(content => content || [])
    );
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Obtiene los años que tienen fechas creadas (periodos abiertos)
   * @param enterpriseId ID de la empresa
   * @returns Observable con la lista de años que tienen fechas creadas
   */
  getYearsWithOpenPeriods(enterpriseId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiURL}years/${enterpriseId}`);
  }
}
