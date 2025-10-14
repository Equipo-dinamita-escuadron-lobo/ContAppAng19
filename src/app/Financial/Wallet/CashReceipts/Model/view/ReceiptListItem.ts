/**
 * Modelo de datos optimizado para mostrar un recibo en una lista o tabla.
 * Contiene solo la información necesaria para la vista de listado,
 * como el nombre del cliente en lugar de solo su ID.
 */

export interface ReceiptView {
    id: number;
    receiptCode: string;
    issueDate: Date;
    thirdPartyId: number;
    clientName: string;
    status: 'Activo' | 'Anulado';
    totalAmount: number;
}
