import { Balance, SaleDetail } from './KardexResponse';

export interface KardexRow {
  idKardex: number | null;
  date: string;
  detail: string;
  entryQuantity: number | null;
  entryUnitPrice: number | null;
  entryTotalPrice: number | null;
  outputDetails: SaleDetail[] | null;
  balance: Balance[];
  outputQuantity: number;
  outputTotalPrice: number;
  totalBalanceQuantity: number;
  totalBalanceValue: number;
  formattedDate: string;
}
