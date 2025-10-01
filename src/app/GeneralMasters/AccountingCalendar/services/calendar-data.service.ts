import { Injectable } from '@angular/core';
import { AccountingCalendar, CalendarMonth, MonthStatus } from '../models/accounting-calendar.model';
import { parseDateFromBackend, toDateKey } from '../utils/date.utils';

/**
 * Servicio dedicado al manejo de datos y cache del calendario
 * Responsabilidad: Gestión de datos, cache y transformaciones
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarDataService {

  // Mapa de entradas activas por fecha (YYYY-MM-DD) para eliminar por ID
  private activeEntriesByDate: Map<string, AccountingCalendar> = new Map();

  /**
   * Actualiza el calendario con los datos recibidos del backend
   * @param calendarMonths Meses del calendario
   * @param calendarData Datos del backend
   * @returns Meses actualizados
   */
  updateCalendarWithData(calendarMonths: CalendarMonth[], calendarData: AccountingCalendar[]): CalendarMonth[] {
    const updatedMonths = [...calendarMonths];
    
    if (!calendarData || calendarData.length === 0) {
      // Si no hay datos, el calendario se mantiene rojo (cerrado)
      this.clearActiveEntriesMap();
      return updatedMonths;
    }
    
    // Reconstruir mapa de entradas activas por fecha
    this.rebuildActiveEntriesMap(calendarData);

    // Actualizar los meses con los datos recibidos
    updatedMonths.forEach(month => {
      const updatedMonth = { ...month };
      updatedMonth.days = month.days.map(day => {
        if (day.isCurrentMonth) {
          const wasClosed = day.isClosed;
          const newIsClosed = !this.isDateSelected(day.date, calendarData);
          
          return { 
            ...day, 
            isClosed: newIsClosed
          };
        }
        return { ...day };
      });
      
      // Recalcular estado del mes
      this.updateMonthStatus(updatedMonth);

      // Actualizar el mes en el arreglo
      const monthIndex = updatedMonths.findIndex(m => 
        m.month === updatedMonth.month && m.year === updatedMonth.year
      );
      if (monthIndex !== -1) {
        updatedMonths[monthIndex] = updatedMonth;
      }
    });

    return updatedMonths;
  }

  /**
   * Determina si una fecha está abierta (existe en BD)
   * @param date Fecha a verificar
   * @param calendarData Datos del calendario
   * @returns true si la fecha existe (abierta/verde), false si no existe (cerrada/rojo)
   */
  private isDateSelected(date: Date, calendarData: AccountingCalendar[]): boolean {
    // Si no hay datos, la fecha no existe = cerrada (rojo)
    if (!calendarData || calendarData.length === 0) {
      return false;
    }

    // Buscar si la fecha existe en los datos del backend
    const matchingDate = calendarData.find(period => {
      try {
        const periodDate = parseDateFromBackend(period.date);
        const isMatch = periodDate.getDate() === date.getDate() &&
                       periodDate.getMonth() === date.getMonth() &&
                       periodDate.getFullYear() === date.getFullYear();
        
        return isMatch;
      } catch (e) {
        return false;
      }
    });

    // Si la fecha existe en BD = true (abierta/verde)
    // Si no existe = false (cerrada/rojo)
    return !!matchingDate;
  }

  /**
   * Actualiza el estado de un mes según sus días
   * @param month Mes a actualizar
   */
  updateMonthStatus(month: CalendarMonth): void {
    const currentMonthDays = month.days.filter(d => d.isCurrentMonth);
    
    if (currentMonthDays.length === 0) {
      month.status = MonthStatus.FULLY_CLOSED; // Por defecto cerrado si no hay días
      return;
    }
    
    const selectedDays = currentMonthDays.filter(d => !d.isClosed); // !isClosed = seleccionada
    
    if (selectedDays.length === currentMonthDays.length) {
      month.status = MonthStatus.FULLY_OPEN; // Todo abierto
    } else {
      month.status = MonthStatus.FULLY_CLOSED; // Todo cerrado
    }
  }

  /**
   * Reconstruye el mapa de entradas activas por fecha
   * @param calendarData Datos del calendario
   */
  private rebuildActiveEntriesMap(calendarData: AccountingCalendar[]): void {
    this.activeEntriesByDate.clear();
    
    for (const entry of calendarData) {
      const key = toDateKey(entry.date);
      if (key) {
        this.activeEntriesByDate.set(key, entry);
      }
    }
  }

  /**
   * Obtiene el mapa de entradas activas por fecha
   * @returns Mapa de entradas activas
   */
  getActiveEntriesMap(): Map<string, AccountingCalendar> {
    return this.activeEntriesByDate;
  }



  /**
   * Verifica si todos los meses están cerrados
   * @param calendarMonths Meses del calendario
   * @returns true si todos los meses están cerrados
   */
  areAllMonthsClosed(calendarMonths: CalendarMonth[]): boolean {
    return calendarMonths.every(month => month.status === MonthStatus.FULLY_CLOSED);
  }

  /**
   * Verifica si todos los meses están abiertos
   * @param calendarMonths Meses del calendario
   * @returns true si todos los meses están abiertos
   */
  areAllMonthsOpen(calendarMonths: CalendarMonth[]): boolean {
    return calendarMonths.every(month => month.status === MonthStatus.FULLY_OPEN);
  }



  /**
   * Limpia el cache completo
   */
  clearCache(): void {
    this.activeEntriesByDate.clear();
  }

  /**
   * Limpia solo el mapa de entradas activas
   */
  clearActiveEntries(): void {
    this.activeEntriesByDate.clear();
  }

  /**
   * Limpia solo el mapa de entradas activas
   */
  private clearActiveEntriesMap(): void {
    this.activeEntriesByDate.clear();
  }


}
