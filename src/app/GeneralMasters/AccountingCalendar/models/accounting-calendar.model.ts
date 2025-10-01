import { CALENDAR_CONSTANTS, NAME_CONSTANTS } from '../constants/calendar.constants';

// Enum para estados del mes
export enum MonthStatus {
  FULLY_OPEN = 'fully_open',
  FULLY_CLOSED = 'fully_closed'
}

// Interfaces principales del calendario contable
export interface AccountingCalendar {
  id?: number;
  idEnterprise: string;
  tenantId?: string;
  date: string;
}

export interface AccountingCalendarCreateMonthReq {
  idEnterprise: string;
  year: number;
  month: number;
}

export interface AccountingCalendarDeleteMonthReq {
  idEnterprise: string;
  year: number;
  month: number;
}

export interface AccountingCalendarCreateYearReq {
  idEnterprise: string;
  year: number;
}

export interface AccountingCalendarDeleteYearReq {
  idEnterprise: string;
  year: number;
}

// Interfaces para la visualización del calendario
export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isClosed: boolean;
  isToday: boolean;
  isHoliday?: boolean; // Indica si es un día festivo
  holidayName?: string; // Nombre del festivo si aplica
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
