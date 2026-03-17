interface ReportAccount {
  accountCode: string;
  accountDescription: string;
  nature: string;
}

export interface EquityChangesStatementResponse {
  account: ReportAccount;
  initialBalance: number;
  debitMovement: number;
  creditMovement: number;
  finalBalance: number;
}

