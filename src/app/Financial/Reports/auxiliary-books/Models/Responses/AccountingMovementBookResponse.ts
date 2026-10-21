import { Account } from '../Account';

export interface AccountingMovementBookResponse {
  voucherType: string;
  date: string;
  state: string;
  thirdPartyId: string;
  thirdPartyName: string;
  account: Account;
  initialBalance: number;
  debitMovement: number;
  creditMovement: number;
  netMovement: number;
  accountCode?: number;
  accountDescription?: string;
}
