export interface FinancialStatementAccountResponse {
  accountCode?: string | null;
  accountDescription?: string | null;
  nature?: string | null;
}

export interface FinancialStatementRowResponse {
  lineDescription?: string | null;
  note?: string | number | null;
  currentAmount?: number | null;
  currentPercentage?: number | null;
  previousAmount?: number | null;
  previousPercentage?: number | null;
  variation?: number | null;
  variationPercentage?: number | null;
  rowType?: string | null;
  changeCode?: string | null;
  changeDescription?: string | null;
  classCode?: string | null;
  classDescription?: string | null;
  periodAmount?: number | null;
  nature?: string | null;
  account?: FinancialStatementAccountResponse | null;
  initialBalance?: number | null;
  debitMovement?: number | null;
  creditMovement?: number | null;
  finalBalance?: number | null;
  yearValues?: Record<string, number> | null;
  accountCode?: string | null;
  accountDescription?: string | null;
}
