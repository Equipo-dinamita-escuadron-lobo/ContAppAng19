export interface KardexPurchaseRequest {
    details: string;
    quantity: number;
    unitPrice: string;
    factCode:number;
    productId: number;
    date?: string; // Fecha opcional en formato ISO 8601
  }
  