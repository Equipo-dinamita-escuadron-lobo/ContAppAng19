import { AccountingEntryLine } from "./AccountinEntryLine";
import { Receipt } from "./Receipt";

export interface ReceiptDetailsView extends Omit<Receipt, 'details' | 'thirdPartyId'> {
    clientName: string;
    paymentMethodName: string; 
    isDirectIncome: boolean;
    details: {
        invoiceId: number;
        invoiceCode: string; 
        amountPaid: number;
    }[];

    // Añadimos el asiento contable aqui
    id?: number;
    receiptCode?: string;
    issueDate?: Date;
    accountingEntry?: AccountingEntryLine[];
}