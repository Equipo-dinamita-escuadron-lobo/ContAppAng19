export interface AccountingEntryView {
  id: number;
  code: string;
  date: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ANULADO';
  sourceDocumentId: number;
  movements: AccountingMovementView[];
  totalDebit: number;
  totalCredit: number;
}

export interface AccountingMovementView {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  thirdPartyId: number;
  thirdPartyName: string;
  description: string;
  debit: number;
  credit: number;
}

