export interface ExpenseReceiptDetailResponse {
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;     
    accountingAccount: number;
}

export interface ExpenseReceiptResponse {
    id: number;
    receiptCode: string;
    thirdPartyId: number;
    paymentMethodId: number;
    
    status: string;
    issueDate: string;
    totalAmount: number;
    observations: string;
    details: ExpenseReceiptDetailResponse[];
}
