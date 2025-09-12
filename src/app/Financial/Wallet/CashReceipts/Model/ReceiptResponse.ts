export interface ReceiptDetailResponse {
    invoiceId: number;
    amountPaid: number;
}

export interface ReceiptResponse {
    id: number;                     
    receiptCode: string;              
    thirdPartyId: number;             
    status: string;                   
    issueDate: string;                
    totalAmount: number;              
    observations: string;             
    details: ReceiptDetailResponse[];
}