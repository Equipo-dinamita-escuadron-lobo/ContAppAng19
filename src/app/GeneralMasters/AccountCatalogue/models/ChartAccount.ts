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
    parent?: string | number | null;
    parentAccount?: Account;
    crossing?: boolean | null;
    costCenter?: boolean | null;
    status?: boolean;
}

// Interface para listas
export interface AccountCatalogueListRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string | null;
    crossing?: boolean | null;
    costCenter?: boolean | null;
    status?: boolean;
    children: AccountCatalogueListRes[];
}

export interface AuxiliaryAccountsApiResponse {
    auxiliaryAccounts: AccountCatalogueListRes[];
    totalCount: number;
    idEnterprise: string;
}

// Interface para items individuales
export interface ItemAccountCatalogueSearchRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
}

// Interface para crear cuenta
export interface AccountCatalogueCreateRes {
    id: number;
    idEnterprise: string;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
    crossing?: boolean | null;
    costCenter?: boolean | null;
    status?: boolean;
}

// Interface para actualizar cuenta
export interface AccountCatalogueUpdateRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
    crossing?: boolean | null;
    costCenter?: boolean | null;
    status?: boolean;
}