import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ProductType } from '../Models/ProductType';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductTypeService {

  constructor(private readonly http: HttpClient) { }

  // Método para obtener todos los tipos de producto con paginación
  findAll(enterpriseId: string, page = 0, size = 10, sortField = 'name', sortOrder = 'asc', search = ''): Observable<Page<ProductType>> {
    let url = `${environment.API_URL}product-types/findAll?enterpriseId=${enterpriseId}&numPage=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<Page<ProductType>>(url);
  }

  // Método para obtener todos los tipos de producto activos
  findActivate(enterpriseId: string): Observable<ProductType[]> {
    const url = `${environment.API_URL}product-types/findActivate?enterpriseId=${enterpriseId}`;
    return this.http.get<Page<ProductType>>(url).pipe(
      map((page: Page<ProductType>) => page.content)
    );
  }

  // Método para obtener todos los tipos de producto de una empresa
  getProductTypes(enterpriseId: string): Observable<ProductType[]> {
    return this.http.get<ProductType[]>(`${environment.API_URL}product-types/enterprise/${enterpriseId}`);
  }

  // Método para obtener un tipo de producto por su ID
  getProductTypeById(id: string, enterpriseId: string): Observable<ProductType> {
    const url = `${environment.API_URL}product-types/${id}?enterpriseId=${enterpriseId}`;
    return this.http.get<ProductType>(url);
  }

  // Método para crear un nuevo tipo de producto
  createProductType(productType: ProductType): Observable<ProductType> {
    const url = `${environment.API_URL}product-types`;
    return this.http.post<ProductType>(url, productType);
  }

  // Método para actualizar un tipo de producto existente
  updateProductType(productType: ProductType): Observable<ProductType> {
    const url = `${environment.API_URL}product-types/${productType.id}`;
    return this.http.put<ProductType>(url, productType);
  }

  // Método para eliminar un tipo de producto
  deleteProductType(id: string, enterpriseId: string): Observable<any> {
    const url = `${environment.API_URL}product-types/${id}?enterpriseId=${enterpriseId}`;
    return this.http.delete(url);
  }

  // Método para cambiar el estado de un tipo de producto
  changeProductTypeState(id: number, enterpriseId: string): Observable<any> {
    const url = `${environment.API_URL}product-types/changeState/${id}?enterpriseId=${enterpriseId}`;
    return this.http.put(url, {});
  }
}
