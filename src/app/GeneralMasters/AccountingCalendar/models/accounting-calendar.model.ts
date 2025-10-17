import { CALENDAR_CONSTANTS, NAME_CONSTANTS } from '../constants/calendar.constants';

// Enum para estados del mes
export enum MonthStatus {
  FULLY_OPEN = 'fully_open',
  FULLY_CLOSED = 'fully_closed'
}

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

export interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isClosed: boolean;
  isToday: boolean;
  isHoliday?: boolean;
  holidayName?: string;
}

export interface CalendarMonth {
  name: string;
  year: number;
  month: number;
  days: CalendarDay[];
  status: MonthStatus;
}

// Exportar constantes del calendario
export { CALENDAR_CONSTANTS, NAME_CONSTANTS };
