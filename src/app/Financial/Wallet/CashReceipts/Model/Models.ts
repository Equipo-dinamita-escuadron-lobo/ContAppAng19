// Interfaz genérica para opciones de dropdowns
export interface DropdownOption {
    label: string;
    value: any; 
}

// Interfaz para el cliente
export interface Client {
    id: number;
    name: string;
    accountsReceivableAccount: {
        id: number;
        code: string; 
        name: string;
    };
}

// Interfaz para las facturas pendientes de un cliente
export interface Invoice {
    id: number;
    factCode: string;
    expirationDate: Date;
    pendingValue: number;
    selectedForPayment?: boolean; 
    amountToPay?: number; 
}

// Interfaz para la vista de lista de recibos
export interface ReceiptView {
    id: number;
    receiptCode: string;
    issueDate: Date;
    thirdPartyId: number;
    clientName: string;
    status: 'Activo' | 'Anulado';
    totalAmount: number;
}