import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { CalendarValidationService } from './calendar-validation.service';
import { toDateKey } from '../utils/date.utils';
import { 
  AccountingCalendar, 
  CalendarMonth, 
  CalendarDay,
  MonthStatus,
  AccountingCalendarCreateMonthReq,
  AccountingCalendarDeleteMonthReq,
  AccountingCalendarCreateYearReq,
  AccountingCalendarDeleteYearReq
} from '../models/accounting-calendar.model';

/**
 * Servicio dedicado a las operaciones del calendario
 * Responsabilidad: Manejar operaciones CRUD y cambios de estado
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarOperationsService {

  constructor(
    private calendarService: AccountingCalendarService,
    private validation: CalendarValidationService
  ) {}

  /**
   * Toggle de una fecha específica
   * @param day Día a toggle
   * @param enterpriseId ID de la empresa
   * @param selectedYear Año seleccionado
   * @param activeEntriesByDate Mapa de entradas activas
   * @returns Observable con la respuesta
   */
  toggleDate(
    day: CalendarDay, 
    enterpriseId: string, 
    selectedYear: number,
    activeEntriesByDate: Map<string, AccountingCalendar>
  ): Observable<any> {
    if (!this.validation.canModifyDay(day)) {
      return throwError(() => new Error(this.validation.getDayNotModifiableMessage()));
    }
    
    if (!this.validation.isValidEnterpriseId(enterpriseId)) {
      return throwError(() => new Error(this.validation.getInvalidEnterpriseMessage()));
    }
    
    const dateKey = toDateKey(day.date);
    const isCurrentlyClosed = day.isClosed;

    try {
      // Si (!isClosed) -> eliminar por ID; si (isClosed) -> crear
      const action$: Observable<any> = !isCurrentlyClosed
        ? this.deleteByDateKey(enterpriseId, dateKey, activeEntriesByDate, selectedYear)
        : this.createByDateKey(enterpriseId, dateKey);

      return action$.pipe(
        switchMap(() => this.calendarService.findAllByYear(enterpriseId, selectedYear))
      );
    } catch (error) {
      return throwError(() => new Error(`Error interno en toggleDate: ${error}`));
    }
  }

  /**
   * Cambia el estado de un mes completo
   * @param month Mes a cambiar
   * @param enterpriseId ID de la empresa
   * @returns Observable con la respuesta
   */
  changeMonthState(month: CalendarMonth, enterpriseId: string): Observable<any> {
    if (!this.validation.isValidEnterpriseId(enterpriseId)) {
      return throwError(() => new Error(this.validation.getInvalidEnterpriseMessage()));
    }
    
    // Determinar si abrir o cerrar el mes
    const shouldOpen = month.status === MonthStatus.FULLY_CLOSED;
    
    if (shouldOpen) {
      return this.openMonth(month, enterpriseId);
    } else {
      return this.closeMonth(month, enterpriseId);
    }
  }

  /**
   * Cambia el estado de todos los periodos
   * @param openAll Si es true, abre todos los periodos; si es false, los cierra
   * @param enterpriseId ID de la empresa
   * @param year Año
   * @returns Observable con la respuesta
   */
  changeAllPeriodsState(openAll: boolean, enterpriseId: string, year: number): Observable<any> {
    if (!this.validation.isValidEnterpriseId(enterpriseId)) {
      return throwError(() => new Error(this.validation.getInvalidEnterpriseMessage()));
    }
    
    if (openAll) {
      return this.openYear(enterpriseId, year);
    } else {
      return this.closeYear(enterpriseId, year);
    }
  }

  /**
   * Abre un mes completo
   */
  private openMonth(month: CalendarMonth, enterpriseId: string): Observable<any> {
    const request: AccountingCalendarCreateMonthReq = {
      idEnterprise: enterpriseId,
      year: month.year,
      month: month.month + 1 // usa 1-12
    };
    
    return this.calendarService.openMonth(request).pipe(
      switchMap(() => this.calendarService.findAllByYear(enterpriseId, month.year))
    );
  }

  /**
   * Cierra un mes completo
   */
  private closeMonth(month: CalendarMonth, enterpriseId: string): Observable<any> {
    const request: AccountingCalendarDeleteMonthReq = {
      idEnterprise: enterpriseId,
      year: month.year,
      month: month.month + 1 
    };
    
    return this.calendarService.deleteByMonth(request).pipe(
      switchMap(() => this.calendarService.findAllByYear(enterpriseId, month.year))
    );
  }

  /**
   * Abre un año completo
   */
  private openYear(enterpriseId: string, year: number): Observable<any> {
    const request: AccountingCalendarCreateYearReq = {
      idEnterprise: enterpriseId,
      year: year
    };
    
    return this.calendarService.openYear(request).pipe(
      switchMap(() => this.calendarService.findAllByYear(enterpriseId, year))
    );
  }

  /**
   * Cierra un año completo
   */
  private closeYear(enterpriseId: string, year: number): Observable<any> {
    const request: AccountingCalendarDeleteYearReq = {
      idEnterprise: enterpriseId,
      year: year
    };
    
    return this.calendarService.deleteByYear(request).pipe(
      switchMap(() => this.calendarService.findAllByYear(enterpriseId, year))
    );
  }

  /**
   * Crea una entrada por fecha
   */
  private createByDateKey(enterpriseId: string, dateKey: string): Observable<any> {
    const payload = { idEnterprise: enterpriseId, date: dateKey };
    return this.calendarService.create(payload);
  }

  /**
   * Elimina una entrada por fecha
   */
  private deleteByDateKey(
    enterpriseId: string, 
    dateKey: string, 
    activeEntriesByDate: Map<string, AccountingCalendar>,
    selectedYear: number
  ): Observable<any> {
    const entry = activeEntriesByDate.get(dateKey);
    if (entry?.id) {
      return this.calendarService.delete(entry.id, enterpriseId);
    }
    
    // Fallback: si por alguna razón no está en el mapa, recuperar activos y buscar ID
    return this.calendarService
      .findAllByYear(enterpriseId, selectedYear)
      .pipe(
        map(dates => dates.find((e: AccountingCalendar) => toDateKey(e.date) === dateKey)),
        switchMap((found?: AccountingCalendar) => {
          if (found?.id) {
            return this.calendarService.delete(found.id, enterpriseId);
          }
          return throwError(() => new Error('No se encontró el ID de la fecha a eliminar'));
        })
      );
  }


}
