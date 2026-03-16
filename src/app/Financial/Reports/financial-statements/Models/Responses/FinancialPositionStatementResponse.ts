interface ReportAccount {
  accountCode: string;
  accountDescription: string;
  nature: string;
}

export interface FinancialPositionStatementResponse {
  account?: ReportAccount | null;
  description?: string;
  value?: number | null;
  lineDescription?: string;
  note?: string | number | null;
  currentAmount?: number | null;
  currentPercentage?: number | null;
  previousAmount?: number | null;
  previousPercentage?: number | null;
  variation?: number | null;
  variationPercentage?: number | null;
  rowType?: string;
}
