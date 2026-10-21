export interface InvoiceDetail {
  id: number;
  factCode: string;
  clientId: number;
  creationDate: string; // O Date si lo transformas
  expirationDate: string; // O Date
  totalValue: number;
  totalPay: number;
  pendingValue: number;
  status: string;
  daysInArrears: number;
}