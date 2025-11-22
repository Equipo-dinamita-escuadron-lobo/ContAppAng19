export interface PortfolioAgingAccount {
  accountCode: string;
  accountName: string;
  totalAdeudado: number;
  corriente: number;
  dias1a30: number;
  dias31a60: number;
  dias61a90: number;
  masDe90dias: number;
  children: PortfolioAgingAccount[];
}