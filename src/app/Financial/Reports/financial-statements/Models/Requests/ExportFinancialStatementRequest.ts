export interface InfoReportTemplate {
  id: number;
  name: string;
  pathLogotype: string;
  alienation: 'LEFT' | 'CENTER' | 'RIGHT';
  font: string;
  fontSize: number;
  mainColor: string;
}

export interface ExportFinancialStatementRequest {
  reportId?: string;
  format: 'EXCEL' | 'PDF';
  entName: string;
  financialStatement: any;
  financialStatementData: any[];
  infoReportTemplate: InfoReportTemplate;
}
