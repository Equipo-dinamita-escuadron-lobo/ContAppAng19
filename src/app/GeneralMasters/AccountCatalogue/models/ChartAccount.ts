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
}

// Interface que coincide con la respuesta del backend para listas
export interface AccountCatalogueListRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string | null;
    children: AccountCatalogueListRes[];
}

// Interface que coincide con la respuesta del backend para items individuales
export interface ItemAccountCatalogueSearchRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
}

// Interface que coincide con la respuesta del backend para crear cuenta
export interface AccountCatalogueCreateRes {
    id: number;
    idEnterprise: string;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
}

// Interface que coincide con la respuesta del backend para actualizar cuenta
export interface AccountCatalogueUpdateRes {
    id: number;
    code: string;
    description: string;
    nature: string;
    financialStatus: string;
    classification: string;
    parent: string;
}