
export type ExportFormat = 'EXCEL' | 'PDF';
export type ExportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ExportType = 'SESSION' | 'OPERATION' | 'DOCUMENT';

export interface ExportJobResponse {
  jobId: string;
  status: ExportStatus;
  progress: number;
  totalRecords: number;
  fileName: string;
  exportType: ExportType;
  exportFormat: ExportFormat;
  errorMessage?: string;
  startTime: string;
  endTime?: string;
}