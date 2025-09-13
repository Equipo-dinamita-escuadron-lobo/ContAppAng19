export interface InventoryAndBalancesResponse {
  account: { accountCode: number; accountDescription: string };
  description: string;
  value: number;
}
