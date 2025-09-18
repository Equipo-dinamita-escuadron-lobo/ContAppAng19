export interface ReceiptDetailResponse {
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;     
    accountingAccount: number;
}

export interface ReceiptResponse {
    id: number;
    receiptCode: string;
    thirdPartyId: number;
    paymentMethodId: number;
    
    status: string;
    issueDate: string;
    totalAmount: number;
    observations: string;
    details: ReceiptDetailResponse[];
}