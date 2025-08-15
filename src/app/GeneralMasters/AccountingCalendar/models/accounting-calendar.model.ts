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
  isFullyClosed: boolean;
  isFullyOpen: boolean;
}
