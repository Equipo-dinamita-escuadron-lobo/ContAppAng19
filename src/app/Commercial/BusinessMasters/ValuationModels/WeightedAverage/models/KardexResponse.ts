export type MovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'SALESRETURN'
  | 'PURCHASERETURN'
  | 'ADJUSTMENT';

export interface KardexResponse {
  id: number;
  quantity: number;
  unitPrice: string;
  details: string;
  type: MovementType;
  balanceQuantity: number;
  balanceUnitPrice: string;
  date: string;
}
