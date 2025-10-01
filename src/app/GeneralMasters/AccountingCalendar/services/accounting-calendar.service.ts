import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { 
  AccountingCalendar, 
  AccountingCalendarCreateMonthReq,
  AccountingCalendarDeleteMonthReq,
  AccountingCalendarCreateYearReq,
  AccountingCalendarDeleteYearReq
} from '../models/accounting-calendar.model';
import { PAGINATION_CONSTANTS } from '../constants/calendar.constants';
import { Page } from '../types/calendar.types';

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
   * Toggle de fecha: si existe se elimina, si no existe se crea
   * IMPORTANTE: El backend ya NO maneja status
   * - Crear fecha = Abrirla (verde)
   * - Eliminar fecha = Cerrarla (rojo)
   * @param enterpriseId ID de la empresa
   * @param date Fecha a toggle (formato YYYY-MM-DD)
   */
  toggleDate(enterpriseId: string, date: string): Observable<void> {
    const normalizedInputDate = this.normalizeDateString(date);
    
    // 1. Intentar crear la fecha (sin status, el backend ya no lo usa)
    const payload = {
      idEnterprise: enterpriseId,
      date: normalizedInputDate
    };
    
    return this.create(payload).pipe(
      map(() => undefined),
      catchError(error => {
        if (error?.status === 400 && error?.error?.code === 'ACCOUNTING_CALENDAR_DATE_EXISTS') {
          // La fecha ya existe, retornar error descriptivo
          // El frontend deberá manejar la eliminación por separado
          return throwError(() => new Error(`La fecha ${normalizedInputDate} ya existe. Use la funcionalidad de eliminar para cerrarla.`));
        }
        
        // Para otros tipos de error, propagar
        return throwError(() => error);
      })
    );
  }

  /**
   * Normaliza una fecha string para comparación consistente
   * @param dateString Fecha en formato string
   * @returns Fecha normalizada en formato YYYY-MM-DD
   */
  private normalizeDateString(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Si ya está en formato YYYY-MM-DD, retornarlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
      }
      
      // Si es una fecha ISO, convertirla
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Formatear como YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      return '';
    }
  }

  /**
   * Verifica qué años tienen fechas creadas (periodos abiertos)
   * @param enterpriseId ID de la empresa
   * @param years Lista de años a verificar
   * @returns Observable con la lista de años que tienen fechas creadas
   */
  getYearsWithOpenPeriods(enterpriseId: string, years: number[]): Observable<number[]> {
    if (!years || years.length === 0) {
      return of([]);
    }

    // Crear observables para verificar cada año
    const yearChecks = years.map(year => 
      this.findAllByYear(enterpriseId, year).pipe(
        map(dates => dates.length > 0 ? year : null),
        catchError(() => of(null))
      )
    );

    // Ejecutar todas las verificaciones en paralelo
    return forkJoin(yearChecks).pipe(
      map(results => results.filter(year => year !== null) as number[])
    );
  }
}
