export type ReportExportFormat = 'PDF' | 'EXCEL';
export type ReportDeliveryFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface CreateFinancialStatementEmailScheduleRequest {
  reportId: string;
  recipientEmail: string;
  format: ReportExportFormat;
  frequency: ReportDeliveryFrequency;
  hourOfDay: number;
  minuteOfHour: number;
  dayOfWeek?: number | null;
  dayOfMonth?: number | null;
  timezone?: string;
}
