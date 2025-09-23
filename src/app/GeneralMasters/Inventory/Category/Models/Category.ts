export interface Category {
    id?: number; 
    name: string; 
    description: string;
    enterpriseId: string;
    state: boolean; 
    taxId?: number; 
    // Cuentas contables
    inventoryId: number; 
    costId: number;
    saleId: number;
    returnId: number;
}
export interface CategoryList {
    id: number; 
    name: string; 
    description: string;
    enterpriseId: string;
    state: boolean; // Cambiado de string a boolean para coincidir con backend
    // Nombres de cuentas para visualización
    inventoryName: string; 
    costName: string;
    saleName: string;
    returnName: string;
}