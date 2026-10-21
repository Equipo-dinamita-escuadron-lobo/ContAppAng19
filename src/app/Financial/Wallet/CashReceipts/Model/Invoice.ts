/**
 * Representa una factura pendiente de un cliente.
 * Utilizado en las listas de selección de facturas para aplicar pagos.
 */
export interface Invoice {
    id: number;
    factCode: string;
    creationDate: Date;
    expirationDate: Date;
    pendingValue: number;
    thirdId: number;
    clientName?: string; // Nombre del cliente, opcionalmente cargado desde el servicio de terceros.
    // Propiedades opcionales añadidas por el frontend para la interacción del usuario.
    selectedForPayment?: boolean; 
    amountToPay?: number; 
    totalValue?: number;
}