/**
 * DTO para crear un nuevo castigo de cartera.
 * Coincide con CreateWriteOffRequest en el backend.
 */
export interface CreateWriteOffRequestDto {
    justification: string;
    writeOffDate: string; // Formato ISO: "YYYY-MM-DD"
    debitAuxiliaryAccount: number;
    debitAuxiliaryAccountId: number;
    enterpriseId: string;
    details: WriteOffDetailRequestDto[];
}

/**
 * DTO para el detalle de la factura en la petición de creación.
 * Coincide con WriteOffDetailRequest en el backend.
 */
export interface WriteOffDetailRequestDto {
    invoiceId: number;
}