// Interfaz genérica para opciones de dropdowns
export interface DropdownOption {
    label: string;
    value: any; // Puede ser string, number, etc.
}

// Interfaz para el cliente (tercero)
export interface Client {
    id: number;
    name: string;
    // Otros campos relevantes del cliente que puedan venir del backend
}

// Interfaz para las facturas pendientes de un cliente
export interface Invoice {
    id: number;
    code: string;
    dueDate: Date;
    pendingBalance: number;
    selectedForPayment?: boolean; // Campo de UI
    amountToPay?: number; // Campo de UI
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