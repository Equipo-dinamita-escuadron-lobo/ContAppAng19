import { AccountingEntryLine } from "./AccountingEntryLine";
import { ExpenseReceiptDetail } from "./ExpenseReceiptDetail";


export interface ExpenseReceipt {
    id?: number;
    receiptCode?: string;
    thirdPartyId?: number;
    status?: string;
    issueDate?: Date;
    totalAmount?: number;
    observations?: string;
    details?: ExpenseReceiptDetail[];
    paymentMethodId?: number;
    auxAccount?: number;
    // Añadimos el campo para el asiento contable.
    accountingEntry?: AccountingEntryLine[];
}
