export interface ClientPortfolioSummary {
  clientId: number;
  totalDebt: number;
  overdueAmount: number;
  dueToAmount: number;

}

export interface ClientPortfolioView {
  clientId: number;
  clientIdentification: string;
  clientName: string;
  totalDebt: number;
  overdueAmount: number;
  dueToAmount: number;

}

export interface InvoiceDetailView {
  id: number;
  factCode: number;
  clientId: number;
  creationDate: string;
  expirationDate: string;
  totalValue: number;
  totalPay: number;
  pendingValue: number;
  status: string;
  daysInArrears: number;
}

export interface ReceiptSummaryView {
  id: number;
  receiptCode: string;
  issueDate: string;
  amountPaid: number;
}