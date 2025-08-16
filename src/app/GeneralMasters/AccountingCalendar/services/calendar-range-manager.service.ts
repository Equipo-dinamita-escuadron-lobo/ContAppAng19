import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { AccountingCalendar } from '../models/accounting-calendar.model';

/**
 * Servicio para gestionar rangos de fechas del calendario contable
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarRangeManagerService {

  constructor(private calendarService: AccountingCalendarService) {}

  /**
   * Inicializa el año completo si no existe
   * @param enterpriseId ID de la empresa
   * @param year Año a inicializar
   * @returns Observable con el resultado de la operación
   */
  initializeYearIfNotExists(enterpriseId: string, year: number): Observable<boolean> {
    return this.calendarService.checkYearExists(enterpriseId, year).pipe(
      map(exists => {
        if (!exists) {
          // Crear el año completo como fechas individuales
          this.calendarService.createYearDates(enterpriseId, year).subscribe();
          return true;
        }
        return true;
      }),
      catchError(error => {
        console.error('Error al verificar/crear el año:', error);
        return of(false);
      })
    );
  }

  /**
   * Abre un rango específico de fechas (crea todas las fechas del rango)
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio del rango a abrir
   * @param endDate Fecha de fin del rango a abrir
   * @returns Observable con el resultado de la operación
   */
  openDateRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<void> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Crear fechas individuales para cada día del rango
    return this.createDateRange(enterpriseId, startDateStr, endDateStr);
  }

  /**
   * Cierra un rango específico de fechas (elimina todas las fechas del rango)
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio del rango a cerrar
   * @param endDate Fecha de fin del rango a cerrar
   * @returns Observable con el resultado de la operación
   */
  closeDateRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<void> {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Eliminar fechas individuales para cada día del rango
    return this.deleteDateRange(enterpriseId, startDateStr, endDateStr);
  }

  /**
   * Crea fechas para un rango específico
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio (formato YYYY-MM-DD)
   * @param endDate Fecha de fin (formato YYYY-MM-DD)
   */
  private createDateRange(enterpriseId: string, startDate: string, endDate: string): Observable<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const requests: Observable<AccountingCalendar>[] = [];
    
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      // Crear cada fecha individual
      const payload = {
        idEnterprise: enterpriseId,
        startDate: dateStr,
        endDate: dateStr,
        status: true
      };
      requests.push(this.calendarService.create(payload));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Ejecutar todas las creaciones en paralelo
    return forkJoin(requests).pipe(map(() => {}));
  }

  /**
   * Elimina fechas de un rango específico
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio (formato YYYY-MM-DD)
   * @param endDate Fecha de fin (formato YYYY-MM-DD)
   */
  private deleteDateRange(enterpriseId: string, startDate: string, endDate: string): Observable<void> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Buscar todas las fechas del rango
    return this.calendarService.findByRange(enterpriseId, startDate, endDate, 0, 1000).pipe(
      switchMap(response => {
        if (response.content.length === 0) {
          return of(undefined);
        }
        
        // Eliminar cada fecha encontrada
        const deleteRequests = response.content
          .filter(date => date.id)
          .map(date => this.calendarService.delete(date.id!, enterpriseId));
        
        return forkJoin(deleteRequests).pipe(map(() => {}));
      })
    );
  }

  /**
   * Optimiza los rangos del año (método simplificado)
   * @param enterpriseId ID de la empresa
   * @param year Año a optimizar
   * @returns Observable con el resultado de la optimización
   */
  optimizeRanges(enterpriseId: string, year: number): Observable<void> {
    // Por ahora, este método simplemente recarga los datos del año
    return this.calendarService.findByYear(enterpriseId, year).pipe(
      map(() => {}),
      catchError(error => {
        console.error('Error al optimizar rangos:', error);
        return of(undefined);
      })
    );
  }
}
