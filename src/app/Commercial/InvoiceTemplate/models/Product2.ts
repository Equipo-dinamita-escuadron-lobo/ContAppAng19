export interface Product2 {
  productId: number;
  amount: number;
  description: string;
  descount: number;
  unitPrice: number;
  subtotal: number;
  taxPercentage: number[];
}

export interface ProductResponse {
  id: number;
  productId: number;
  reference: string;
  name: string;
  presentation: string;
  manager: string;
  enterpriseId: string;
}

