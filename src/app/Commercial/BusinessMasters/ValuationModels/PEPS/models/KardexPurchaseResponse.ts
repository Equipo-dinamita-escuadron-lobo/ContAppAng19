export interface KardexPurchaseResponse {
  idKardex: number;
  date: string;
  details: string;
  quantity: number;     
  unitPrice: number;    
  type: string;
  factCode: number;      
}