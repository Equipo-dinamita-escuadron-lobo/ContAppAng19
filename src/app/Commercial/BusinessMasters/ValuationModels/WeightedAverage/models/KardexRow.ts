export interface KardexRow {
  kardexId?: number;
  date: string;
  details: string;
  quantity: number;
  unitPrice: number;
  type?: string;

  entryQuantity?: number;
  entryUnitPrice?: number;
  entryTotal?: number;

  exitQuantity?: number;
  exitUnitPrice?: number;
  exitTotal?: number;

  balanceQuantity: number;
  balanceUnitPrice: number;
  totalBalance: number;
  formattedDate?: string;
}
