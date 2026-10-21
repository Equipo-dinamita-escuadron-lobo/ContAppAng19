import { WriteOffStatus } from "../enum/WriteOffStatus";

/**
 * DTO para la respuesta completa de un castigo de cartera.
 * Coincide con PortfolioWriteOffResponse en el backend.
 */
export interface PortfolioWriteOffResponseDto {
    id: number;
    code: string;
    justification: string;
    totalAmount: number;
    writeOffDate: string; 
    debitAuxiliaryAccount: number;
    debitAuxiliaryAccountId: number;
    thirdId: number;
    status: WriteOffStatus;
    enterpriseId: string;
    details: WriteOffDetailResponseDto[];
}

/**
 * DTO para el detalle de castigo enriquecido en la respuesta.
 * Coincide con WriteOffDetailResponse en el backend.
 */
export interface WriteOffDetailResponseDto {
    amountWrittenOff: number;
    invoice: InvoiceSummaryResponseDto;
}

/**
 * DTO con el resumen de una factura, usado en la respuesta.
 * Coincide con InvoiceSummaryResponse en el backend.
 */
export interface InvoiceSummaryResponseDto {
    id: number;
    factCode: string;
    totalValue: number;
    pendingValue: number;
    expirationDate: string;
    accountingAccount: string;
}