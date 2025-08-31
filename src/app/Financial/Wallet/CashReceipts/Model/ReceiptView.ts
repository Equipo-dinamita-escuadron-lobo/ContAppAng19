import { Receipt } from "./Receipt";

export interface ReceiptDetailsView extends Omit<Receipt, 'details' | 'thirdPartyId'> {
    clientName: string;
    paymentMethodName: string; // Para mostrar el nombre, no el ID
    isDirectIncome: boolean;
    details: {
        invoiceId: number;
        invoiceCode: string; // Necesitamos el código para mostrarlo
        amountPaid: number;
    }[];
}