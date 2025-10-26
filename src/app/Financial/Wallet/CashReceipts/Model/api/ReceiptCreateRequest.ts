import { ReceiptDetail } from "../ReceiptDetail";

/**
 * Define la estructura de datos requerida por el endpoint de la API
 * para crear un nuevo recibo de caja. Este es el payload que se envía.
 */
export interface ReceiptCreateRequest {
    thirdPartyId: number,
    paymentMethodId: number,
    paymentMethodAccount: number,
    receiptTypeId: number, 
    observations: string ,
    enterpriseId: string,
    totalAmount: number,
    details: ReceiptDetail[],
    ledgerAccountId: number,
    centerCostId?: number
}