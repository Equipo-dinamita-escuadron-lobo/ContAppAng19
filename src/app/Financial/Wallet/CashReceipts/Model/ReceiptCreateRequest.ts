import { ReceiptDetail } from "./ReceiptDetail";

export interface ReceiptCreateRequest {
    thirdPartyId: number,
    paymentMethodId: number,
    receiptTypeId: number, // Asegúrate que el dropdown entrega el ID numérico
    observations: string,
    enterpriseId: string,
    totalAmount: number,
    details: ReceiptDetail[],
    ledgerAccountId: number
}