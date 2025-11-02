export interface KardexPurchaseRequest {
  quantity: number;
  unitPrice: number;
  details: string;
  productId: number;
  date?: string; // Fecha opcional en formato ISO 8601
}
