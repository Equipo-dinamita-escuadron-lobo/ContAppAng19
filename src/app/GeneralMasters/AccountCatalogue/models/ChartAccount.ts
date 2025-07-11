export interface Account {
    id?: number;
    idEnterprise?: string;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    children?: Account[];
    showSubAccounts?: boolean;
    parent?: string | number;
    parentAccount?: Account;
}