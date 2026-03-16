import {
  ExportFinancialStatementRequest,
  InfoReportTemplate,
} from './ExportFinancialStatementRequest';

export interface ExportFinancialStatementEmailRequest
  extends ExportFinancialStatementRequest {
  toEmail: string;
  infoReportTemplate: InfoReportTemplate;
}
