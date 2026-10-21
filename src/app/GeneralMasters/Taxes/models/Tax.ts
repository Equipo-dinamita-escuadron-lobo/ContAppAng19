export interface Tax {
    id: number;
    code: string;
    description: string;
    interest: number;
    purchaseTax: string; // Código cuenta impuesto de compra
    salesTax: string; // Código cuenta impuesto de venta
    idEnterprise: string;
    status: boolean;
}

export interface TaxList {
    id: number;
    code: string;
    description: string;
    interest: number;
    salesTax: string; // Código de cuenta impuesto de venta
    purchaseTax: string; // Código de cuenta impuesto de compra
    salesTaxName: string;
    purchaseTaxName: string;
    idEnterprise: string;
    status: boolean;
}

export interface TaxCreateRequest {
    code: string;
    description: string;
    interest: number;
    purchaseTaxId?: number; // Opcional
    salesTaxId?: number; // Opcional
    idEnterprise: string;
}

export interface TaxUpdateRequest {
    id: number;
    code: string;
    description: string;
    interest: number;
    purchaseTaxId?: number; // Opcional
    salesTaxId?: number; // Opcional
    idEnterprise: string;
} 