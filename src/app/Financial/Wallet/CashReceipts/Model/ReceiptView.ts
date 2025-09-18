import { AccountingEntryLine } from "./AccountinEntryLine";
import { Receipt } from "./Receipt";

/*export interface ReceiptDetailsView extends Omit<Receipt, 'details' | 'thirdPartyId'> {
    clientName: string;
    paymentMethodName: string; 
    isDirectIncome: boolean;
    details: {
        invoiceId: number;
        invoiceCode: string; 
        amountPaid: number;   
        accountingAccount: number;
    }[];

    // Añadimos el asiento contable aqui
    id?: number;
    receiptCode?: string;
    issueDate?: Date;
    accountingEntry?: AccountingEntryLine[];
}*/

export interface ReceiptDetailView { // <-- Esta es la interfaz del detalle de la vista
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;        // <-- ¡Ajustado!
    accountingAccount: number;  // <-- ¡Ajustado!
    // Podrías añadir: accountingAccountName?: string; si quieres mostrar el nombre
}

export interface ReceiptDetailsView {
    id: number;
    receiptCode: string;
    issueDate: Date;
    thirdPartyId: number; // Aunque no se muestra, es útil tenerlo
    clientName: string;
    paymentMethodName: string;
    status: 'Activo' | 'Anulado';
    totalAmount: number;
    observations: string;
    isDirectIncome: boolean;
    details: ReceiptDetailView[]; // Usa la interfaz de detalle actualizada
    accountingEntry?: AccountingEntryLine[];
}