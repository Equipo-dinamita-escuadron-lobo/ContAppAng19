import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
   * Crea un nuevo registro en el calendario contable
   * @param payload Datos para crear el calendario
   */
  create(payload: any): Observable<AccountingCalendar> {
    return this.http.post<AccountingCalendar>(`${this.apiURL}create`, payload);
  }

  /**
   * Obtiene un calendario por ID y empresa
   * @param id ID del calendario
   * @param enterpriseId ID de la empresa
   */
  findById(id: number, enterpriseId: string): Observable<AccountingCalendar> {
    return this.http.get<AccountingCalendar>(`${this.apiURL}findById/${id}/${enterpriseId}`);
  }

  /**
   * Obtiene calendarios por rango de fechas
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @param page Número de página (por defecto 0)
   * @param size Tamaño de página (por defecto 10)
   */
  findByRange(
    enterpriseId: string, 
    startDate: string, 
    endDate: string, 
    page: number = PAGINATION_CONSTANTS.DEFAULT_PAGE, 
    size: number = 10
  ): Observable<Page<AccountingCalendar>> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('page', page.toString())
      .set('size', size.toString());
    
    return this.http.get<Page<AccountingCalendar>>(`${this.apiURL}findByRange/${enterpriseId}`, { params });
  }

  /**
   * Elimina un registro del calendario contable
   * @param id ID del registro a eliminar
   * @param enterpriseId ID de la empresa
   */
  delete(id: number, enterpriseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete/${id}/${enterpriseId}`);
  }

  // ========== MÉTODOS DE UTILIDAD PARA EL CALENDARIO ==========

  /**
   * Crea un solo día en el calendario (siempre con estado true)
   * @param enterpriseId ID de la empresa
   * @param date Fecha a crear (formato YYYY-MM-DD)
   */
  createSingleDay(enterpriseId: string, date: string): Observable<AccountingCalendar> {
    const payload = {
      idEnterprise: enterpriseId,
      startDate: date,
      endDate: date,
      status: true // Siempre true - fecha seleccionada
    };
    return this.create(payload);
  }



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
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return this.findByRange(enterpriseId, startDate, endDate, page, size);
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
   * Toggle de fecha: si existe se elimina, si no existe se crea
   * @param enterpriseId ID de la empresa
   * @param date Fecha a toggle (formato YYYY-MM-DD)
   */
  toggleDate(enterpriseId: string, date: string): Observable<void> {
    // Buscar si la fecha ya existe
    const startDate = date;
    const endDate = date;
    
    return this.findByRange(enterpriseId, startDate, endDate, 0, 1).pipe(
      switchMap(response => {
        if (response.content.length > 0) {
          // La fecha existe, eliminarla
          const existingDate = response.content[0];
          if (existingDate.id) {
            return this.delete(existingDate.id, enterpriseId);
          }
        } else {
          // La fecha no existe, crearla
          return this.createSingleDay(enterpriseId, date).pipe(map(() => {}));
        }
        return of(undefined);
      })
    );
  }

  /**
   * Verifica qué años tienen periodos contables abiertos
   * @param enterpriseId ID de la empresa
   * @param years Lista de años a verificar
   * @returns Observable con la lista de años que tienen periodos abiertos
   */
  getYearsWithOpenPeriods(enterpriseId: string, years: number[]): Observable<number[]> {
    if (!years || years.length === 0) {
      return of([]);
    }

    // Crear observables para verificar cada año
    const yearChecks = years.map(year => 
      this.checkYearExists(enterpriseId, year).pipe(
        map(hasDates => hasDates ? year : null),
        catchError(() => of(null))
      )
    );

    // Ejecutar todas las verificaciones en paralelo
    return forkJoin(yearChecks).pipe(
      map(results => results.filter(year => year !== null) as number[])
    );
  }


}
