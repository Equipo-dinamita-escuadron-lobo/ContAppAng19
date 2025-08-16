import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AccountingCalendar, AccountingCalendarDateState, AccountingCalendarRangeState } from '../models/accounting-calendar.model';
import { PAGINATION_CONSTANTS } from '../constants/calendar.constants';
import { Page } from '../types/calendar.types';

@Injectable({
  providedIn: 'root'
})
export class AccountingCalendarService {
  private readonly http = inject(HttpClient);
  private readonly apiURL = environment.API_URL + 'config/accounting-calendar/';

  /**
   * Obtener calendario por año
   * @param enterpriseId ID de la empresa
   * @param year Año del calendario
   * @param page Número de página (por defecto 0)
   * @param size Tamaño de página (por defecto 1000)
   */
  findByYear(
    enterpriseId: string, 
    year: number, 
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE, 
    size: number = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Observable<Page<AccountingCalendar>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<AccountingCalendar>>(`${this.apiURL}findByYear/${enterpriseId}`, { params });
  }

  /**
   * Obtener calendario por rango de fechas
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @param page Número de página (por defecto 0)
   * @param size Tamaño de página (por defecto 1000)
   */
  findByRange(
    enterpriseId: string, 
    startDate: string, 
    endDate: string, 
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE, 
    size: number = PAGINATION_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Observable<Page<AccountingCalendar>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<AccountingCalendar>>(`${this.apiURL}findByRange/${enterpriseId}`, { params });
  }

  /**
   * Cambiar estado de todas las fechas
   * @param enterpriseId ID de la empresa
   * @param status Nuevo estado (true = abierto, false = cerrado)
   */
  changeStateAll(enterpriseId: string, status: boolean): Observable<void> {
    const params = new HttpParams().set('status', status.toString());
    return this.http.post<void>(`${this.apiURL}changeState/all/${enterpriseId}`, null, { params });
  }

  /**
   * Cambiar estado de un rango de fechas
   * @param payload Datos del rango a cambiar
   */
  changeStateRange(payload: AccountingCalendarRangeState): Observable<void> {
    return this.http.post<void>(`${this.apiURL}changeState/range`, payload);
  }

  /**
   * Cambiar estado de una fecha específica
   * @param payload Datos de la fecha a cambiar
   */
  changeDateState(payload: AccountingCalendarDateState): Observable<void> {
    // Para una fecha individual, usamos el mismo día como fecha de inicio y fin
    const rangePayload: AccountingCalendarRangeState = {
      idEnterprise: payload.idEnterprise,
      startDate: payload.date,
      endDate: payload.date,
      status: payload.status
    };
    return this.changeStateRange(rangePayload);
  }

  /**
   * Crear o actualizar el estado de una fecha específica
   * Si la fecha no existe, se crea. Si existe, se actualiza
   * @param enterpriseId ID de la empresa
   * @param date Fecha específica (formato YYYY-MM-DD)
   * @param status Nuevo estado (true = abierto, false = cerrado)
   */
  toggleDateState(enterpriseId: string, date: string, status: boolean): Observable<void> {
    const payload: AccountingCalendarDateState = {
      idEnterprise: enterpriseId,
      date: date,
      status: status
    };
    return this.changeDateState(payload);
  }

  /**
   * Crear una fecha individual en el calendario
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio (formato YYYY-MM-DD)
   * @param endDate Fecha de fin (formato YYYY-MM-DD)
   * @param status Estado inicial (por defecto false = cerrado)
   */
  createDate(
    enterpriseId: string, 
    startDate: string, 
    endDate: string, 
    status: boolean = false
  ): Observable<AccountingCalendar> {
    const payload = {
      idEnterprise: enterpriseId,
      startDate: startDate,
      endDate: endDate,
      status: status
    };
    

    
    return this.http.post<AccountingCalendar>(`${this.apiURL}create`, payload);
  }

  /**
   * Crear todas las fechas del año para una empresa
   * @param enterpriseId ID de la empresa
   * @param year Año para crear las fechas
   * @param status Estado inicial de todas las fechas (por defecto false = cerrado)
   */
  createYearDates(enterpriseId: string, year: number, status: boolean = false): Observable<AccountingCalendar[]> {
    const dates: Observable<AccountingCalendar>[] = [];
    
    // Crear una fecha para cada día del año
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dates.push(this.createDate(enterpriseId, dateString, dateString, status));
      }
    }
    
    // Ejecutar todas las creaciones en paralelo
    return forkJoin(dates);
  }

  /**
   * Crear fechas de un mes específico para una empresa
   * @param enterpriseId ID de la empresa
   * @param year Año
   * @param month Mes (1-12)
   * @param status Estado inicial (por defecto false = cerrado)
   */
  createMonthDates(enterpriseId: string, year: number, month: number, status: boolean = false): Observable<AccountingCalendar[]> {
    const dates: Observable<AccountingCalendar>[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      dates.push(this.createDate(enterpriseId, dateString, dateString, status));
    }
    
    return forkJoin(dates);
  }

  /**
   * Crear fechas del año en lotes para mejor performance
   * @param enterpriseId ID de la empresa
   * @param year Año para crear las fechas
   * @param status Estado inicial (por defecto false = cerrado)
   * @param batchSize Tamaño del lote (por defecto 30 días)
   */
  createYearDatesInBatches(enterpriseId: string, year: number, status: boolean = false, batchSize: number = 30): Observable<AccountingCalendar[]> {
    const allDates: string[] = [];
    
    // Generar todas las fechas del año
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        allDates.push(dateString);
      }
    }
    
    // Dividir en lotes
    const batches: Observable<AccountingCalendar[]>[] = [];
    
    for (let i = 0; i < allDates.length; i += batchSize) {
      const batch = allDates.slice(i, i + batchSize);
      const batchObservables = batch.map(date => this.createDate(enterpriseId, date, date, status));
      batches.push(forkJoin(batchObservables));
    }
    
    // Ejecutar lotes secuencialmente para evitar sobrecarga del servidor
    return forkJoin(batches).pipe(
      map(batchResults => batchResults.flat())
    );
  }

  /**
   * Verificar si existen fechas para un año específico
   * @param enterpriseId ID de la empresa
   * @param year Año a verificar
   */
  checkYearExists(enterpriseId: string, year: number): Observable<boolean> {
    return this.findByYear(enterpriseId, year, 0, 1).pipe(
      map(response => response.totalElements > 0),
      catchError(() => of(false))
    );
  }

  /**
   * Eliminar un registro del calendario contable
   * @param id ID del registro a eliminar
   * @param enterpriseId ID de la empresa
   * @returns Observable<void>
   */
  delete(id: number, enterpriseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete/${id}/${enterpriseId}`);
  }
}
