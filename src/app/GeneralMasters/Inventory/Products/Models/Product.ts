import { ProductType } from "../../ProductTypes/Models/ProductType";

export interface Page<T> {
    content: T[];
    page: {
        size: number;
        number: number;
        totalElements: number;
        totalPages: number;
    };
}

export interface Product {
    id: number; 
    code: string;
    name: string; 
    description: string;
    quantity: number | null;
    unitOfMeasureId: number; 
    categoryId: number; 
    enterpriseId: string;
    cost: number | null; 
    state: string; 
    reference: string;
    productTypeId?: number;
    productType?: ProductType; 
    presentation?: string; 
}

export interface ProductList {
    id: number; 
    code: string;
    name: string; 
    description: string;
    quantity: number | null;
    unitOfMeasureName: string;
    categoryName: string;
    enterpriseId: string;
    cost: number | null;
    state: boolean; 
    reference: string;
    presentation?: string; 
    productType: ProductType;
    productTypeName: string; 
}