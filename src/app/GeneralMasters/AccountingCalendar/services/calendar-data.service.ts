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
    console.log(`updateCalendarWithData: Actualizando con ${calendarData?.length || 0} entradas del backend`);
    console.log('updateCalendarWithData: Datos del backend:', calendarData);
    
    const updatedMonths = [...calendarMonths];
    
    if (!calendarData || calendarData.length === 0) {
      console.log('updateCalendarWithData: No hay datos del backend, manteniendo calendario cerrado');
      // Si no hay datos, el calendario se mantiene rojo (cerrado)
      this.clearActiveEntriesMap();
      return updatedMonths;
    }
    
    // Reconstruir mapa de entradas activas por fecha
    this.rebuildActiveEntriesMap(calendarData);

    // Actualizar los meses con los datos recibidos
    updatedMonths.forEach(month => {
      console.log(`updateCalendarWithData: Procesando mes ${month.name} ${month.year}`);
      
      const updatedMonth = { ...month };
      updatedMonth.days = month.days.map(day => {
        if (day.isCurrentMonth) {
          const wasClosed = day.isClosed;
          const newIsClosed = !this.isDateSelected(day.date, calendarData);
          
          if (wasClosed !== newIsClosed) {
            console.log(`updateCalendarWithData: Día ${day.date.toISOString().split('T')[0]} cambió de ${wasClosed} a ${newIsClosed}`);
          }
          
          return { 
            ...day, 
            isClosed: newIsClosed
          };
        }
        return { ...day };
      });
      
      // Recalcular estado del mes
      this.updateMonthStatus(updatedMonth);
      console.log(`updateCalendarWithData: Mes ${month.name} ${month.year} - Estado actualizado: ${updatedMonth.status}`);
      
      // Actualizar el mes en el arreglo
      const monthIndex = updatedMonths.findIndex(m => 
        m.month === updatedMonth.month && m.year === updatedMonth.year
      );
      if (monthIndex !== -1) {
        updatedMonths[monthIndex] = updatedMonth;
      }
    });
    
    console.log('updateCalendarWithData: Actualización completada');
    return updatedMonths;
  }

  /**
   * Determina si una fecha está seleccionada
   * @param date Fecha a verificar
   * @param calendarData Datos del calendario
   * @returns true si la fecha está seleccionada
   */
  private isDateSelected(date: Date, calendarData: AccountingCalendar[]): boolean {
    // Si no hay datos, por defecto no está seleccionada (rojo)
    if (!calendarData || calendarData.length === 0) {
      console.log(`isDateSelected: No hay datos del calendario para fecha ${date.toISOString().split('T')[0]}`);
      return false;
    }

    // Buscar una fecha que coincida exactamente
    const matchingDate = calendarData.find(period => {
      try {
        const periodDate = parseDateFromBackend(period.date);
        const isMatch = periodDate.getDate() === date.getDate() && 
                       periodDate.getMonth() === date.getMonth() && 
                       periodDate.getFullYear() === date.getFullYear();
        
        if (isMatch) {
          console.log(`isDateSelected: Fecha ${date.toISOString().split('T')[0]} encontrada, status: ${period.status}`);
        }
        
        return isMatch;
      } catch (e) {
        console.error(`Error parseando fecha del backend: ${period.date}`, e);
        return false;
      }
    });

    // Si no hay una fecha coincidente, no está seleccionada
    if (!matchingDate) {
      console.log(`isDateSelected: Fecha ${date.toISOString().split('T')[0]} no encontrada en datos del backend`);
      return false;
    }

    // Retornar el estado (true = seleccionada, false = no seleccionada)
    const result = matchingDate.status;
    console.log(`isDateSelected: Fecha ${date.toISOString().split('T')[0]} - Estado final: ${result}`);
    return result;
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
