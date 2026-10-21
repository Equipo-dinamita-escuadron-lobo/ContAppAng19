import { Account } from '../Account';

export interface ThirdPartyBookResponse {
  date: string;
  account: Account;
  debitMovement: number;
  creditMovement: number;
  balanceMovement: number;
  thirdPartyId: string;
  thirdPartyName: string;
  voucherCostCenter: string;
  voucherNumber: string;
}
