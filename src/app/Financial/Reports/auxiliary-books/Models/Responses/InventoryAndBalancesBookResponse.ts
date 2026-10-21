import { Account } from '../Account';

export interface InventoryAndBalancesResponse {
  account: Account;
  description: string;
  value: number;
}
