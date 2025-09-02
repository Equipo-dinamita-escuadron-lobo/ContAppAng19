import { ReceiptDetail } from "./ReceiptDetail";


export interface Receipt {
    id?: number;
    receiptCode?: string;
    thirdPartyId?: number;
    status?: string;
    issueDate?: Date;
    totalAmount?: number;
    observations?: string;
    details?: ReceiptDetail[];
    paymentMethodId?: number;
    auxAccount?: number;
}