import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CalendarMonth, CalendarDay, MonthStatus } from '../../models/accounting-calendar.model';
import { CSS_CLASS_CONSTANTS, NAME_CONSTANTS } from '../../constants/calendar.constants';

/**
 * Componente para mostrar un mes del calendario contable
 * Este componente se encarga únicamente de la visualización de un mes
 * y emite eventos cuando el usuario interactúa con él
 */
@Component({
  selector: 'app-month-calendar',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './month-calendar.component.html',
  styleUrls: ['./month-calendar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MonthCalendarComponent {
  @Input() month!: CalendarMonth;
  
  @Output() dayClick = new EventEmitter<CalendarDay>();
  @Output() monthStatusClick = new EventEmitter<CalendarMonth>();
  
  // Constantes
  readonly dayNames = NAME_CONSTANTS.DAY_NAMES;
  
  /**
   * Obtiene la clase CSS para el grid del mes según su estado
   */
  getMonthGridClass(): string {
    if (!this.month) return '';
    
    switch (this.month.status) {
      case MonthStatus.FULLY_CLOSED:
        return CSS_CLASS_CONSTANTS.MONTH_STATUS.FULLY_CLOSED;
      case MonthStatus.FULLY_OPEN:
        return CSS_CLASS_CONSTANTS.MONTH_STATUS.FULLY_OPEN;
      default:
        return ''; // Sin clase específica para otros casos
    }
  }
  
  /**
   * Obtiene la clase CSS para un día según su estado
   */
  getDayClass(day: CalendarDay): string {
    let classes = 'calendar-day';
    
    if (!day.isCurrentMonth) {
      classes += ' other-month';
      classes += ` ${CSS_CLASS_CONSTANTS.DAY_STATUS.OTHER_MONTH}`;
    } else {
      if (day.isClosed) {
        classes += ` ${CSS_CLASS_CONSTANTS.DAY_STATUS.CLOSED}`;
      } else {
        classes += ` ${CSS_CLASS_CONSTANTS.DAY_STATUS.OPEN}`;
      }
      
      if (day.isToday) {
        classes += ` ${CSS_CLASS_CONSTANTS.DAY_STATUS.TODAY}`;
      }
    }
    
    return classes;
  }
  
  /**
   * Maneja el clic en un día
   */
  onDayClick(day: CalendarDay): void {
    if (!day.isCurrentMonth) return;
    this.dayClick.emit(day);
  }
  
  /**
   * Maneja el clic en el botón de estado del mes
   */
  onMonthStatusClick(): void {
    this.monthStatusClick.emit(this.month);
  }
  
  /**
   * Función para trackBy en ngFor de días
   */
  trackByDay(index: number, day: CalendarDay): string {
    // Usar formato ISO más eficiente que getTime()
    const dateKey = day.date.toISOString().split('T')[0];
    return `${dateKey}-${day.isCurrentMonth}`;
  }
}