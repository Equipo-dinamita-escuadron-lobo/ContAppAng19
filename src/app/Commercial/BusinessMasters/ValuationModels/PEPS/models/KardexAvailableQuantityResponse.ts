export interface KardexAvailableQuantityResponse{
  idKardex: number;
  date: string;
  details: string;
  availableQuantity: number;     
  unitPrice: number;    
  type: string;
  factCode: number;
}