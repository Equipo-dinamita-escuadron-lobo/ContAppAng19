export interface KardexSaleRequest {
  quantity: number;
  productId: number;
  factCode: number;
  details: string;
   date?: string; // Fecha opcional en formato ISO 8601
}
