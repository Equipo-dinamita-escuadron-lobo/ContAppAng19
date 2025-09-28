export interface AccountingEntryResponse {
  id: number;
  code: string;
  date: string; // O Date si prefieres manejarlo como objeto Date
  description: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ANULADO'; // Ajusta los estados según tu enum de backend
  sourceDocumentId: number;
  movements: AccountingMovementResponse[];
}

export interface AccountingMovementResponse {
  id: number;
  account: number; // ID de la cuenta contable
  thirdPartyId: number;
  description: string;
  debit: number;
  credit: number;
}