import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { AccountingCalendarService } from './accounting-calendar.service';
import { AccountingCalendar } from '../models/accounting-calendar.model';
import { formatDateForBackend } from '../utils/date.utils';

/**
 * Servicio para gestionar rangos de fechas del calendario contable
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarRangeManagerService {

  constructor(private calendarService: AccountingCalendarService) {}

  /**
   * Inicializa el año completo como cerrado si no existe
   * @param enterpriseId ID de la empresa
   * @param year Año a inicializar
   * @returns Observable con el resultado de la operación
   */
  initializeYearIfNotExists(enterpriseId: string, year: number): Observable<AccountingCalendar | null> {
    return this.calendarService.checkYearExists(enterpriseId, year).pipe(
      switchMap(exists => {
        if (!exists) {
          // Crear el año completo como un solo rango cerrado
          // Asegurar formato correcto YYYY-MM-DD
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;
          
          return this.calendarService.createDate(enterpriseId, startDate, endDate, false).pipe(
            map(result => {
              return result;
            }),
            catchError(error => {
              console.error('Error al crear el rango del año:', error);
              throw error;
            })
          );
        }
        return of(null);
      }),
      catchError(error => {
        console.error('Error al verificar/crear el año:', error);
        return of(null);
      })
    );
  }

  /**
   * Abre un rango específico de fechas, fragmentando el rango existente si es necesario
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio del rango a abrir
   * @param endDate Fecha de fin del rango a abrir
   * @returns Observable con el resultado de la operación
   */
  openDateRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<AccountingCalendar[]> {
    const formattedStart = formatDateForBackend(startDate);
    const formattedEnd = formatDateForBackend(endDate);
    
    // NUEVA ESTRATEGIA: Fragmentación inteligente en frontend
    return this.fragmentAndOpenRange(enterpriseId, startDate, endDate).pipe(
      switchMap(() => {
        const year = startDate.getFullYear();
        return this.calendarService.findByYear(enterpriseId, year);
      }),
      map(response => {
        return response.content || [];
      }),
      catchError(error => {
        console.error('❌ Error en openDateRange:', error);
        throw error;
      })
    );
  }

  /**
   * Cierra un rango específico de fechas, consolidando rangos adyacentes si es posible
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio del rango a cerrar
   * @param endDate Fecha de fin del rango a cerrar
   * @returns Observable con el resultado de la operación
   */
  closeDateRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<AccountingCalendar[]> {
    const formattedStart = formatDateForBackend(startDate);
    const formattedEnd = formatDateForBackend(endDate);
    
    return this.fragmentAndCloseRange(enterpriseId, startDate, endDate).pipe(
      switchMap(() => {
        const year = startDate.getFullYear();
        return this.calendarService.findByYear(enterpriseId, year);
      }),
      map(response => {
        return response.content || [];
      }),
      catchError(error => {
        console.error('❌ Error en closeDateRange:', error);
        throw error;
      })
    );
  }

  /**
   * Busca rangos que se solapan con el período especificado
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Observable con los rangos solapados
   */
  private findOverlappingRanges(enterpriseId: string, startDate: Date, endDate: Date): Observable<AccountingCalendar[]> {
    const year = startDate.getFullYear();
    
    return this.calendarService.findByYear(enterpriseId, year).pipe(
      map(response => {
        const allRanges = response.content || [];
        
        // Filtrar rangos que realmente se solapan
        const overlappingRanges = allRanges.filter(range => {
          const rangeStart = new Date(range.startDate);
          const rangeEnd = new Date(range.endDate);
          
          // Verificar si hay solapamiento real
          return !(rangeEnd < startDate || rangeStart > endDate);
        });
        
        return overlappingRanges;
      })
    );
  }

  /**
   * Optimiza los rangos del año para consolidar rangos adyacentes con el mismo estado
   * @param enterpriseId ID de la empresa
   * @param year Año a optimizar
   * @returns Observable con el resultado de la optimización
   */
  optimizeRanges(enterpriseId: string, year: number): Observable<void> {
    return this.calendarService.findByYear(enterpriseId, year).pipe(
      switchMap(response => {
        const ranges = response.content || [];
        if (ranges.length <= 1) return of(void 0);
        
        // Implementar lógica de consolidación aquí si es necesario
        return of(void 0);
      })
    );
  }

  /**
   * Fragmenta y abre un rango específico
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Observable con el resultado
   */
  private fragmentAndOpenRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<any> {
    return this.findOverlappingRanges(enterpriseId, startDate, endDate).pipe(
      switchMap(overlappingRanges => {
        if (overlappingRanges.length === 0) {
          // No hay solapamiento, crear rango directamente
          return this.calendarService.createDate(enterpriseId, formatDateForBackend(startDate), formatDateForBackend(endDate), true);
        }
        
        // Eliminar rangos solapados y crear nuevos fragmentos
        const deleteOperations = overlappingRanges.map(range => {
          if (range.id) {
            return this.calendarService.delete(range.id, enterpriseId);
          }
          return of(void 0);
        });
        
        return forkJoin(deleteOperations).pipe(
          switchMap(() => {
            // Crear nuevos fragmentos
            const fragments = this.calculateFragments(overlappingRanges, startDate, endDate, true);
            const createOperations = fragments.map(fragment => 
              this.calendarService.createDate(enterpriseId, fragment.startDate, fragment.endDate, fragment.status)
            );
            
            return forkJoin(createOperations);
          })
        );
      })
    );
  }

  /**
   * Fragmenta y cierra un rango específico
   * @param enterpriseId ID de la empresa
   * @param startDate Fecha de inicio
   * @param endDate Fecha de fin
   * @returns Observable con el resultado
   */
  private fragmentAndCloseRange(enterpriseId: string, startDate: Date, endDate: Date): Observable<any> {
    return this.findOverlappingRanges(enterpriseId, startDate, endDate).pipe(
      switchMap(overlappingRanges => {
        if (overlappingRanges.length === 0) {
          // No hay solapamiento, crear rango directamente
          return this.calendarService.createDate(enterpriseId, formatDateForBackend(startDate), formatDateForBackend(endDate), false);
        }
        
        // Eliminar rangos solapados y crear nuevos fragmentos
        const deleteOperations = overlappingRanges.map(range => {
          if (range.id) {
            return this.calendarService.delete(range.id, enterpriseId);
          }
          return of(void 0);
        });
        
        return forkJoin(deleteOperations).pipe(
          switchMap(() => {
            // Crear nuevos fragmentos
            const fragments = this.calculateFragments(overlappingRanges, startDate, endDate, false);
            const createOperations = fragments.map(fragment => 
              this.calendarService.createDate(enterpriseId, fragment.startDate, fragment.endDate, fragment.status)
            );
            
            return forkJoin(createOperations);
          })
        );
      })
    );
  }

  /**
   * Calcula los fragmentos necesarios al fragmentar un rango
   * @param overlappingRanges Rangos que se solapan
   * @param newStartDate Nueva fecha de inicio
   * @param newEndDate Nueva fecha de fin
   * @param newStatus Nuevo estado
   * @returns Array de fragmentos
   */
  private calculateFragments(
    overlappingRanges: AccountingCalendar[], 
    newStartDate: Date, 
    newEndDate: Date, 
    newStatus: boolean
  ): Array<{startDate: string, endDate: string, status: boolean}> {
    const fragments: Array<{startDate: string, endDate: string, status: boolean}> = [];
    
    overlappingRanges.forEach(range => {
      const originalStart = new Date(range.startDate);
      const originalEnd = new Date(range.endDate);
      const originalStatus = range.status;
      
      // Fragmento ANTES del nuevo rango
      const beforeEnd = new Date(newStartDate);
      beforeEnd.setDate(beforeEnd.getDate() - 1);
      
      if (beforeEnd >= originalStart) {
        fragments.push({
          startDate: formatDateForBackend(originalStart),
          endDate: formatDateForBackend(beforeEnd),
          status: originalStatus
        });
      }
      
      // Fragmento INTERSECCIÓN (el nuevo rango)
      fragments.push({
        startDate: formatDateForBackend(newStartDate),
        endDate: formatDateForBackend(newEndDate),
        status: newStatus
      });
      
      // Fragmento DESPUÉS del nuevo rango
      const afterStart = new Date(newEndDate);
      afterStart.setDate(afterStart.getDate() + 1);
      
      if (afterStart <= originalEnd) {
        fragments.push({
          startDate: formatDateForBackend(afterStart),
          endDate: formatDateForBackend(originalEnd),
          status: originalStatus
        });
      }
    });
    
    return fragments;
  }
}
