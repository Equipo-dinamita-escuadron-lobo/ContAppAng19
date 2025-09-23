export interface Balance {
  amount: number;
  unitPrice: number;
  totalPrice: number;
}

export interface KardexRecordsDTOResponse {
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
}
