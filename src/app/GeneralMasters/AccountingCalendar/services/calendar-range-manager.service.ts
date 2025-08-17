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
      switchMap(exists => {
        if (!exists) {
          // Crear el año completo como fechas individuales
          // Usar createDateRange para verificar fechas existentes antes de crear
          const startDate = new Date(year, 0, 1); // 1 de enero
          const endDate = new Date(year, 11, 31); // 31 de diciembre
          return this.createDateRange(enterpriseId, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]).pipe(
            map(() => true)
          );
        }
        return of(true);
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
    
    // Primero, verificar qué fechas ya existen en el rango
    return this.calendarService.findByRange(enterpriseId, startDate, endDate, 0, 1000).pipe(
      switchMap(existingDates => {
        const existingDateStrings = new Set<string>();
        
        // Crear un Set con las fechas que ya existen
        existingDates.content.forEach(date => {
          try {
            const start = new Date(date.startDate);
            const end = new Date(date.endDate);
            const current = new Date(start);
            
            // Agregar todas las fechas del rango existente al Set
            while (current <= end) {
              existingDateStrings.add(current.toISOString().split('T')[0]);
              current.setDate(current.getDate() + 1);
            }
          } catch (e) {
            console.error('Error al procesar fecha existente:', e);
          }
        });
        
        // Crear solo las fechas que no existen
        const requests: Observable<AccountingCalendar>[] = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Solo crear la fecha si no existe
          if (!existingDateStrings.has(dateStr)) {
            const payload = {
              idEnterprise: enterpriseId,
              startDate: dateStr,
              endDate: dateStr,
              status: true
            };
            requests.push(this.calendarService.create(payload));
          }
          // Si la fecha ya existe, no hacer nada (evitar error de solapamiento)
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Si no hay fechas nuevas que crear, retornar inmediatamente
        if (requests.length === 0) {
          return of(undefined);
        }
    
        return forkJoin(requests).pipe(map(() => {}));
      })
    );
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
   * Recarga los rangos del año
   * @param enterpriseId ID de la empresa
   * @param year Año a recargar
   * @returns Observable con el resultado de la recarga
   */
  optimizeRanges(enterpriseId: string, year: number): Observable<void> {
    // Por ahora, este método simplemente recarga los datos del año
    return this.calendarService.findByYear(enterpriseId, year).pipe(
      map(() => {}),
      catchError(error => {
        console.error('Error al recargar rangos:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Calcula el número de días entre dos fechas
   * @param startDate Fecha de inicio (formato YYYY-MM-DD)
   * @param endDate Fecha de fin (formato YYYY-MM-DD)
   * @returns Número de días en el rango (inclusive)
   */
  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return dayDiff + 1; // +1 porque es inclusivo
  }
}
