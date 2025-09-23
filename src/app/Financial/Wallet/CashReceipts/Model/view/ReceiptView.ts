import { PaymentMethod } from "../../../../../GeneralMasters/PaymentMethods/models/PaymentMethods";
import { AccountingEntryLine } from "../AccountinEntryLine";

/**
 * Representa el detalle de una factura pagada dentro de la vista de detalle del recibo.
 * Es un sub-modelo de `ReceiptDetailView`.
 */
export interface ReceiptDetailView { 
    invoiceId: number;
    amountPaid: number;
    invoiceCode: string;        
    accountingAccount: number;  
    
}

/**
 * Modelo enriquecido diseñado específicamente para la pantalla de "Detalles del Recibo".
 * Combina datos de la respuesta de la API (ReceiptResponse) con datos adicionales
 * (como nombre del cliente, nombre del método de pago) para una visualización completa.
 */
export interface ReceiptDetailsView {
    id: number;
    receiptCode: string;
    issueDate: Date;
    thirdPartyId: number; 
    clientName: string;
    paymentMethodName: string;
    ledgerAccountId: number, 
    status: 'Activo' | 'Anulado';
    totalAmount: number;
    observations: string;
    isDirectIncome: boolean;
    details: ReceiptDetailView[]; 
    accountingEntry?: AccountingEntryLine[];

    //Campos para generar asiento contable
    paymentMethod?: PaymentMethod; 
}