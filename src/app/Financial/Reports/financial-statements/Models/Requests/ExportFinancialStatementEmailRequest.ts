import { ExportFinancialStatementRequest } from './ExportFinancialStatementRequest';

export interface ExportFinancialStatementEmailRequest
  extends ExportFinancialStatementRequest {
  toEmail: string;
}
