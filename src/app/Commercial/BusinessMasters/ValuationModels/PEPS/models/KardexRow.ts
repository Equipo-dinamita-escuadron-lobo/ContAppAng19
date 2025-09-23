import { Balance } from './KardexResponse';

export interface KardexRow {
    idKardex: number | null;
    date: string;
    detail: string;
    entryAmount: number | null;
    entryUnitPrice: number | null;
    entryTotalPrice: number | null;
    outputAmount: number | null;
    outputUnitPrice: number | null;
    outputTotalPrice: number | null;
    balance: Balance[];
    totalBalanceAmount: number;
    totalBalanceValue: number;
    formattedDate: string;
  }