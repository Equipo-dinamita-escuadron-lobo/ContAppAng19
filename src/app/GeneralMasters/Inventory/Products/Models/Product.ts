import { ProductType } from "../../ProductTypes/Models/ProductType";

export interface Page<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface Product {
    id: number; 
    code: string;
    name: string; 
    description: string;
    quantity: number;
    taxPercentage: number[]; 
    taxes?: number[]; // Campo adicional para envío al backend
    unitOfMeasureId: number; 
    categoryId: number; 
    enterpriseId: string;
    cost: number; 
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
    quantity: number;
    taxPercentage: number[];
    taxDisplayText?: string; 
    unitOfMeasureName: string;
    categoryName: string;
    enterpriseId: string;
    cost: number;
    state: boolean; 
    reference: string;
    presentation?: string; 
    productType: ProductType;
    productTypeName: string; 
}