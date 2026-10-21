import { WriteOffStatus } from "../enum/WriteOffStatus";

/**
 * Modelo de Vista para un Castigo de Cartera.
 * Usado por los componentes para mostrar la información.
 */
export interface PortfolioWriteOffView {
    id: number;
    code: string; 
    totalAmount: number;
    justification: string;
    writeOffDate: Date; 
    debitAuxiliaryAccount: number; 
    debitAuxiliaryAccountId: number;
    thirdId: number;
    thirdName?: string;
    status: WriteOffStatus;
    enterpriseId: string;
    details?: WriteOffDetailView[];
}

/**
 * Modelo de Vista para el detalle de un castigo.
 */
export interface WriteOffDetailView {
    amountWrittenOff: number;
    invoice?: InvoiceSummaryView;
}

/**
 * Modelo de Vista para el resumen de la factura.
 */
export interface InvoiceSummaryView {
    id: number;
    factCode: string;
    totalValue: number;
    pendingValue: number;
    expirationDate: Date; 
}