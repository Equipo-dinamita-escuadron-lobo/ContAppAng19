export interface KardexRow {
  date: string;
  details: string;
  quantity: number;
  unitPrice: number;

  entryQuantity?: number;
  entryUnitPrice?: number;
  entryTotal?: number;

  exitQuantity?: number;
  exitUnitPrice?: number;
  exitTotal?: number;

  balanceQuantity: number;
  balanceUnitPrice: number;
  balanceTotal: number;
}
