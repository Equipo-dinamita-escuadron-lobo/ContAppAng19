export interface Category {
    id?: number; 
    name: string; 
    description: string;
    enterpriseId: string;
    state: boolean; 
    taxes?: number[]; // Campo adicional para envío backendal 
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
    state: boolean;
    inventoryName: string; 
    costName: string;
    saleName: string;
    returnName: string;
}