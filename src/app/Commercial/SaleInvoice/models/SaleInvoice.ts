import { ProductS } from "./ProductSelect";

export interface FactureV{
    entId?: string;
    thId?: number;
    factureType: string;
    descounts: number;
    factCode: number;
    factObservations: string;
    factProducts: ProductS[];
    factSubtotals: number;
    facSalesTax: number;
    facWithholdingSource: number;
}