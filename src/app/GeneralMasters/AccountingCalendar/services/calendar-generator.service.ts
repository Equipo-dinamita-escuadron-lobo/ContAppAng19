import { Injectable } from '@angular/core';
import { CalendarMonth, CalendarDay, MonthStatus } from '../models/accounting-calendar.model';
import { ColombianHolidaysService } from './colombian-holidays.service';

/**
 * Servicio dedicado a la generación y creación de calendarios
 * Responsabilidad: Crear la estructura visual del calendario
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarGeneratorService {

  constructor(private holidaysService: ColombianHolidaysService) {}

  /**
   * Genera el calendario completo para un año
   * @param year Año para generar el calendario
   * @returns Array de meses del calendario
   */
  generateYearCalendar(year: number): CalendarMonth[] {
    const calendarMonths: CalendarMonth[] = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = this.createMonthCalendar(month, year);
      calendarMonths.push(monthData);
    }
    
    return calendarMonths;
  }

  /**
   * Crea el calendario para un mes específico
   * @param month Mes (0-11)
   * @param year Año
   * @returns Datos del mes
   */
  createMonthCalendar(month: number, year: number): CalendarMonth {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    
    // Días del mes anterior
    days.push(...this.createPreviousMonthDays(month, year, firstDayOfWeek));
    
    // Días del mes actual
    days.push(...this.createCurrentMonthDays(month, year, daysInMonth));
    
    // Completar con días del mes siguiente
    days.push(...this.createNextMonthDays(month, year, days.length));
    
    // Obtener nombre del mes
    const monthName = this.getMonthName(month);
    
    return {
      name: monthName,
      year,
      month,
      days,
      status: MonthStatus.FULLY_CLOSED // Por defecto cerrado
    };
  }

  /**
   * Crea los días del mes anterior para completar la primera semana
   */
  private createPreviousMonthDays(month: number, year: number, firstDayOfWeek: number): CalendarDay[] {
    const days: CalendarDay[] = [];
    
    if (firstDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        days.push({
          date: new Date(prevYear, prevMonth, day),
          dayOfMonth: day,
          isCurrentMonth: false,
          isClosed: true, // Días de otros meses siempre cerrados
          isToday: false,
          isHoliday: false
        });
      }
    }
    
    return days;
  }

  /**
   * Crea los días del mes actual
   */
  private createCurrentMonthDays(month: number, year: number, daysInMonth: number): CalendarDay[] {
    const days: CalendarDay[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isCurrentDay = this.isToday(date);
      
      // Verificar si es festivo
      const isHoliday = this.holidaysService.isHoliday(date);
      const holiday = this.holidaysService.getHolidayForDate(date);
      
      days.push({
        date,
        dayOfMonth: day,
        isCurrentMonth: true,
        isClosed: true, // Por defecto cerrado
        isToday: isCurrentDay,
        isHoliday,
        holidayName: holiday?.name
      });
    }
    
    return days;
  }

  /**
   * Crea los días del mes siguiente para completar la última semana
   */
  private createNextMonthDays(month: number, year: number, currentDaysCount: number): CalendarDay[] {
    const days: CalendarDay[] = [];
    const totalDays = 42; // 6 semanas * 7 días
    const remainingDays = totalDays - currentDaysCount;
    
    if (remainingDays > 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          date: new Date(nextYear, nextMonth, day),
          dayOfMonth: day,
          isCurrentMonth: false,
          isClosed: true, // Días de otros meses siempre cerrados
          isToday: false,
          isHoliday: false
        });
      }
    }
    
    return days;
  }

  /**
   * Verifica si una fecha es hoy
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  /**
   * Obtiene el nombre del mes
   */
  private getMonthName(month: number): string {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month];
  }
}
