import { Product2 } from "./Product2";

export interface Facture2 {
  factCode: number;
  entId: string;
  thId: number;
  products: Product2[];  // Cambiado de 'factProducts' a 'products'
  totalValue: string;
  totalPay: string;
  pendingValue: string;
  expirationDate: string;
  accountingAccount: number;
  factureType: 'PURCHASE' | 'SALE';
  inventoryConfigType: 'PEPS' | 'WEIGHTED_AVERAGE';
}
