import { AccountingEntryLine } from "./AccountingEntryLine";
import { ExpenseReceipt } from "./ExpenseReceipt";

export interface ExpenseReceiptDetailView { // <-- Esta es la interfaz del detalle de la vista
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;        // <-- ¡Ajustado!
    accountingAccount: number;  // <-- ¡Ajustado!
    // Podrías añadir: accountingAccountName?: string; si quieres mostrar el nombre
}

export interface ExpenseReceiptDetailsView {
    id: number;
    receiptCode: string;
    issueDate: Date;
    thirdPartyId: number; // Aunque no se muestra, es útil tenerlo
    supplierName: string;
    paymentMethodName: string;
    status: 'Activo' | 'Anulado';
    totalAmount: number;
    observations: string;
    isDirectExpense: boolean;
    details: ExpenseReceiptDetailView[]; // Usa la interfaz de detalle actualizada
    accountingEntry?: AccountingEntryLine[];
}
