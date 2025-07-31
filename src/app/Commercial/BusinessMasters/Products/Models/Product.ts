import { ProductType } from "../../ProductTypes/Models/ProductType";


export interface Product {
    id :string;
    code: string;
    itemType: string;
    description: string;
    quantity: number;
    //maxQuantity: number;
    taxPercentage: number;
    creationDate: Date;
    unitOfMeasureId: number;
   // supplierId:  number;
    categoryId: number;
    enterpriseId: string;
    cost: number;
    state: string;
    reference: string;
    productType: ProductType;
  }
  
  export interface ProductList {
    id :string;
    code: string;
    itemType: string;
    description: string;
    quantity: number;
    //maxQuantity: number;
    taxPercentage: number;
    creationDate: Date;

    unitOfMeasureName: string;
    //supplierName:  string;
    categoryName: string;

    enterpriseId: string;

    cost: number;
    state: string;

    reference: string;
    productType: ProductType;
  }