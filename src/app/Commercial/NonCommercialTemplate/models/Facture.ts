import { Product2 } from "./Product2";

export interface Facture2 {
  factId: number;
  entId: string;
  thId: number;
  factCode: number;
  factProducts: Product2[];
  totalValue: string;
  totalPay: string;
  pendingValue: string;
  expirationDate: string;
  accountingAccount: number;
  tagTitle?: string;
}
