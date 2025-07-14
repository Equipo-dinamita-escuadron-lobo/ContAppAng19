export interface ProductToSale {
    id: string;
    itemType: string;
    code: string;
    description: string;
    minQuantity: number;
    maxQuantity: number;
    taxPercentage: number;
    creationDate: Date;
    unitOfMeasureId: number;
    unitOfMeasure: string;
    supplierId: number;
    categoryId: number;
    enterpriseId: string;
    cost: number;
    displayPrice: string;
    state: string;
    amount: number;
    IVA: number;
    IvaValor: number;
    totalValue: number;
    //porcentaje, valor
    descuentos: [number, number];
    displayDescuentos: string;
}