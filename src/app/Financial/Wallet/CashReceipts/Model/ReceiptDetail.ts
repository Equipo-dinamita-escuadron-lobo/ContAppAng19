/**
 * Representa el detalle de un pago aplicado a una factura específica.
 * Es un componente fundamental del objeto `ReceiptCreateRequest`.
 */
export interface ReceiptDetail {
    invoiceId: number;
    amountPaid: number;
}