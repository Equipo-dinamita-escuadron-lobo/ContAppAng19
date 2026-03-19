import { UpsertFinancialStatementAnnotationRequest } from './UpsertFinancialStatementAnnotationRequest';
import { FinancialStatementRowResponse } from '../Responses/FinancialStatementRowResponse';

export type ReportExportFormat = 'EXCEL' | 'PDF';
export type SignatureContentType = 'image/png' | 'image/jpeg' | 'image/jpg';

export interface VisualSignatureRequest {
  fileName: string;
  contentType: SignatureContentType;
  base64Content: string;
  signerName: string;
  signerRole: string;
}

export interface InfoReportTemplate {
  id?: number;
  name?: string;
  pathLogotype?: string;
  alienation?: 'LEFT' | 'CENTER' | 'RIGHT' | null;
  font?: string | null;
  fontSize?: number | null;
  mainColor?: string | null;
}

export interface ExportFinancialStatementRequest {
  reportId?: string;
  format: ReportExportFormat;
  entName?: string;
  financialStatement?: Record<string, unknown> | null;
  financialStatementData?: FinancialStatementRowResponse[];
  annotations?: UpsertFinancialStatementAnnotationRequest[];
  signatures?: VisualSignatureRequest[] | null;
  infoReportTemplate?: InfoReportTemplate | null;
}
