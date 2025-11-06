export interface AgingReportFilter {
  supplierId?: string;
  supplierName?: string;
  accountTypeStart?: string;
  accountTypeEnd?: string;
  cutoffDate?: Date;
  includeDocuments?: boolean;
}

export interface AgingReportLine {
  id: number;
  accountDescription: string;
  totalDue: number;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  status?: string;
}

export interface AgingReportResponse {
  reportDate: Date;
  supplierName: string;
  lines: AgingReportLine[];
  totals: {
    totalDue: number;
    current: number;
    days1to30: number;
    days31to60: number;
    days61to90: number;
  };
}

export interface AccountTypeOption {
  label: string;
  value: string;
}
