export interface Tax {
    id: number;
    code: string;
    description: string;
    interest: number;
    refundAccount: string; // Id cuenta devolución
    depositAccount: string; // Id cuenta depósito
    idEnterprise: string;
}

export interface TaxList {
    id: number;
    code: string;
    description: string;
    interest: number;
    depositAccount: string; // Código de cuenta depósito
    refundAccount: string; // Código de cuenta devolución
    depositAccountName: string;
    refundAccountName: string;
    idEnterprise: string;
}

export interface TaxCreateRequest {
    code: string;
    description: string;
    interest: number;
    refundAccount: string;
    depositAccount: string;
    idEnterprise: string;
}

export interface TaxUpdateRequest {
    id: number;
    code: string;
    description: string;
    interest: number;
    refundAccount: string;
    depositAccount: string;
    idEnterprise: string;
} 