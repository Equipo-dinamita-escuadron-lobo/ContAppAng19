interface ReportAccount {
  accountCode: string;
  accountDescription: string;
  nature: string;
}

export interface BalanceSheetResponse {
  account: ReportAccount;
  description: string;
  value: number;
}

