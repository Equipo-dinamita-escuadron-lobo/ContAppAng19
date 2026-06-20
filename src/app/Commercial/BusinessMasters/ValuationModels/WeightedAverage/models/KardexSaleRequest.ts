export interface KardexSaleRequest {
  quantity: number;
  productId: number;
  details: string;
  date?: string; // Fecha opcional en formato ISO 8601
}
