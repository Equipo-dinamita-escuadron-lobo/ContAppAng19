import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductType } from '../Models/ProductType';

@Injectable({
  providedIn: 'root'
})
export class ProductTypeService {

  constructor(private http: HttpClient) { }

  // Método para obtener todos los tipos de producto de una empresa
  getProductTypes(enterpriseId: string): Observable<ProductType[]> {
    const url = `${environment.API_URL}product-types/findAll/${enterpriseId}`;
    return this.http.get<ProductType[]>(url);
  }

  // Método para obtener un tipo de producto por su ID
  getProductTypeById(id: string): Observable<ProductType> {
    const url = `${environment.API_URL}product-types/findById/${id}`;
    return this.http.get<ProductType>(url);
  }

  // Método para crear un nuevo tipo de producto
  createProductType(productType: ProductType): Observable<ProductType> {
    const url = `${environment.API_URL}product-types/create`;
    return this.http.post<ProductType>(url, productType);
  }

  // Método para actualizar un tipo de producto existente
  updateProductType(productType: ProductType): Observable<ProductType> {
    const url = `${environment.API_URL}product-types/update/${productType.id}`;
    return this.http.put<ProductType>(url, productType);
  }

  // Método para eliminar un tipo de producto
  deleteProductType(id: string): Observable<any> {
    const url = `${environment.API_URL}product-types/delete/${id}`;
    return this.http.delete(url);
  }
}
