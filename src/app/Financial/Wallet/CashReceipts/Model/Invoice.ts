/**
 * Representa una factura pendiente de un cliente.
 * Utilizado en las listas de selección de facturas para aplicar pagos.
 */
export interface Invoice {
    id: number;
    factCode: string;
    expirationDate: Date;
    pendingValue: number;
    
    // Propiedades opcionales añadidas por el frontend para la interacción del usuario.
    selectedForPayment?: boolean; 
    amountToPay?: number; 
    totalValue?: number;
}