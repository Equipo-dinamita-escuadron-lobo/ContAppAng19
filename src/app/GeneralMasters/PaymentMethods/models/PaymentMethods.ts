export interface PaymentMethod {
  id?: number;
  name: string;
  accountingAccount: string;
  status: boolean;
  isDeleted: boolean;
  idEnterprise: string;
}

// Interface simplificada para cuentas contables auxiliares en dropdown
export interface AccountingAccountOption {
  label: string;
  value: string;
}
