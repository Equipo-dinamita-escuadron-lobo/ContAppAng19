import { ProductType } from "../../ProductTypes/Models/ProductType";

export interface Product {
    id: number; // Cambiado de string a number (Long en backend)
    code: string;
    name: string; // Nombre del producto
    description: string;
    quantity: number; // Integer en backend
    taxPercentage: number; // Integer en backend
    creationDate: Date;
    unitOfMeasureId: number; // Long en backend
    categoryId: number; // Long en backend
    enterpriseId: string;
    cost: number; // double en backend
    state: string; // Cambiado a string según lo que devuelve el backend
    reference: string;
    productTypeId?: number; // Long en backend, opcional en caso de que el backend devuelva el objeto completo
    productType?: ProductType; // Objeto completo del tipo de producto, opcional
    presentation?: string; // Campo opcional que puede no estar en el backend
}

export interface ProductList {
    id: number; // Cambiado de string a number
    code: string;
    name: string; // Campo calculado que mapea desde itemType
    description: string;
    quantity: number;
    taxPercentage: number;
    taxDisplayText?: string; // campo para mostrar código + tarifa
    creationDate: Date;
    unitOfMeasureName: string;
    categoryName: string;
    enterpriseId: string;
    cost: number;
    state: boolean; // Convertido a boolean para la interfaz
    reference: string;
    presentation?: string; // Campo opcional
    productType: ProductType;
    productTypeName: string; // Campo calculado para facilitar ordenamiento y filtrado
}