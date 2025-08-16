import { CALENDAR_CONSTANTS, NAME_CONSTANTS } from '../constants/calendar.constants';

// Enums para estados del calendario
export enum CalendarStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  MIXED = 'mixed'
}

export enum MonthStatus {
  FULLY_OPEN = 'fully_open',
  FULLY_CLOSED = 'fully_closed',
  MIXED = 'mixed'
}

// Interfaces principales del calendario contable
export interface AccountingCalendar {
  id?: number;
  idEnterprise: string;
  tenantId?: string;
  startDate: string; // LocalDate 
  endDate: string;   // LocalDate
  status: boolean;   // true: OPEN, false: CLOSED
}

export interface AccountingCalendarDateState {
  idEnterprise: string;
  date: string;      // LocalDate
  status: boolean;   // true: OPEN, false: CLOSED
}

export interface AccountingCalendarRangeState {
  idEnterprise: string;
  startDate: string; // LocalDate 
  endDate: string;   // LocalDate
  status: boolean;   // true: OPEN, false: CLOSED
}

// Interfaces para la visualización del calendario
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isClosed: boolean;
  isToday: boolean;
}

export interface CalendarMonth {
  name: string;
  year: number;
  month: number;
  days: CalendarDay[];
  status: MonthStatus;
}

// Re-exportar constantes para mantener compatibilidad
export { CALENDAR_CONSTANTS, NAME_CONSTANTS };
