/**
 * Define el payload necesario para el endpoint de la API
 * que anula un recibo de caja.
 */
export interface VoidReceiptRequest {
    reason: string;
}