export interface PaymentMethod {
  id?: number;
  name: string;
  accountingAccount: string;
  status: boolean;
  isDeleted: boolean;
  idEnterprise: string;
}
