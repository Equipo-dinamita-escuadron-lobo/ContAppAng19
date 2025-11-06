export interface VendorReportSummary {
  id: number;
  name: string;
  totalDebits: number;
  totalCredits: number;
  currentBalance: number;
  lastTransactionDate: Date;
  transactionCount: number;
}

export interface VendorReportTransaction {
  date: Date;
  dueDate?: Date;
  reference: string;
  documentNumber?: string; // Número del documento original (factura, nota, etc.)
  expenseReceiptNumber?: string; // Número del comprobante de egreso (CE-XXXX)
  type: 'Bill' | 'Payment';
  description: string;
  debits: number;
  credits: number;
  balance: number;
}

export interface VendorReport {
  vendor: {
    id: number;
    name: string;
  };
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  transactions: VendorReportTransaction[];
  periodTotals: {
    totalDebits: number;
    totalCredits: number;
    netBalance: number;
  };
  totalDue: number;
  agingReport: {
    prePaid: number;
    current: number;
    days0to30: number;
    days31to60: number;
    days61to90: number;
    days91Plus: number;
    total: number;
  };
}

export interface VendorListFilter {
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  balanceFrom?: number;
  balanceTo?: number;
  status?: 'all' | 'with_balance' | 'no_balance';
}
