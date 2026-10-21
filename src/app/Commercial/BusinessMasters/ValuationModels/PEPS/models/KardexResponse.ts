export interface Balance {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleDetail {
  quantityUsed: number;
  unitPrice: number;
  totalPrice: number;
}

export interface KardexRecordsDTOResponse {
  idKardex: number | null;
  date: string;
  detail: string;
  entryQuantity: number | null;
  entryUnitPrice: number | null;
  entryTotalPrice: number | null;
  outputDetails: SaleDetail[] | null;
  balance: Balance[];
}
