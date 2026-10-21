/**
 * Define la estructura del detalle de una factura pagada,
 * tal como la devuelve la API en la respuesta de un recibo.
 */
export interface ReceiptDetailResponse {
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;     
    accountingAccount: number;
}

/**
 * Define la estructura completa de un recibo de caja tal como la
 * devuelve la API. Es la respuesta estándar para GET, POST y PUT.
 */
export interface ReceiptResponse {
    id: number;
    receiptCode: string;
    thirdPartyId: number;
    paymentMethodId: number;
    ledgerAccountId: number, 
    
    status: string;
    issueDate: string;
    totalAmount: number;
    observations: string;
    details: ReceiptDetailResponse[];
}