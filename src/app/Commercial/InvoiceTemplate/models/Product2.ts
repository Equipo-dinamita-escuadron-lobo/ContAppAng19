export interface Product2 {
  productId: number;
  amount: number;
  description: string;
  discount: number;  // Cambiado de 'descount' a 'discount'
  unitPrice: number;
  subtotal: number;
  taxPercentage: number[];
}

export interface ProductList2 {
  id: number;
  name: string;
  enterpriseId: string;
}
