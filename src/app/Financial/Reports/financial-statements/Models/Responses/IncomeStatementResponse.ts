interface ReportAccount {
  accountCode: string;
  accountDescription: string;
  nature: string;
}

export interface IncomeStatementResponse {
  date: string;
  accountCode: string;
  accountDescription: string;
  voucherCode: string;
  voucherName: string;
  debit: number;
  credit: number;
  account: ReportAccount;
}

