import { Product2 } from "./Product2";
export type InventoryConfigurationType = 'PEPS' | 'WEIGHTED_AVERAGE';
export type SkeletonFactureType = 'NON_COMMERCIAL_ENTRY' | 'NON_COMMERCIAL_EXIT';

export interface Facture2 {
  factId: number;
  entId: string;
  thId: number;
  factCode: number;
  products: Product2[];
  totalValue: string;
  totalPay: string;
  pendingValue: string;
  expirationDate: string;
  accountingAccount: number;
  tagTitle?: string;
  factureType: SkeletonFactureType;
  inventoryConfigType: InventoryConfigurationType;
}
