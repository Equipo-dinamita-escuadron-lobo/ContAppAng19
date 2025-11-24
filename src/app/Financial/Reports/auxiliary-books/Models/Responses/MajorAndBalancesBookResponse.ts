import { Account } from '../Account';

export interface MajorAndBalancesResponse {
  account: Account;
  balance: number;
  debit: number;
  credit: number;
  date: string;
}
