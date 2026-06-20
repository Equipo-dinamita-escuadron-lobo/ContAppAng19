export interface ProductType {
  id: number; 
  name: string; 
  description: string;
  enterpriseId: string;
  state: boolean; // Removido el opcional para garantizar que siempre tenga valor
}

export interface ProductTypeList {
  id: number; 
  name: string;
  description: string;
  enterpriseId: string;
  state: boolean; // Removido el opcional para consistencia
}
  