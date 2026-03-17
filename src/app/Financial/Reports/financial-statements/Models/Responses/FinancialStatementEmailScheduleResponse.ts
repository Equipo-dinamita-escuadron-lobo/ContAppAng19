import {
  ReportDeliveryFrequency,
  ReportExportFormat,
} from '../Requests/CreateFinancialStatementEmailScheduleRequest';

export interface FinancialStatementEmailScheduleResponse {
  id: number;
  reportId: string;
  recipientEmail: string;
  format: ReportExportFormat;
  frequency: ReportDeliveryFrequency;
  hourOfDay: number;
  minuteOfHour: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  timezone: string;
  active: boolean;
  nextRunAt: string;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
