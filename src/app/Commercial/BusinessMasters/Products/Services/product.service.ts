import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { delay, Observable, of } from 'rxjs';
import { Product } from '../Models/Product';
import { ProductType } from '../Models/ProductType';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(enterpriseId:string): Observable<Product[]> {
    

    // --- CÓDIGO ORIGINAL (CONEXIÓN AL BACKEND) ---
    const url = `${API_URL}products/findAll/${enterpriseId}`;
    return this.http.get<Product[]>(url);
  }

  createProduct(product: Product): Observable<Product> {
    const url = `${environment.API_URL}products/create`;
    return this.http.post<Product>(url, product);
  }

  // Ahora acepta el ID y los datos como parámetros separados.
  updateProduct(id: string, productData: Product): Observable<Product> {
    const url = `${API_URL}products/update/${id}`; // La URL se construye con el ID recibido.
    // El cuerpo de la petición son los datos del producto.
    return this.http.put<Product>(url, productData);
  }
  
  getProductById(id: string): Observable<Product> {
    const url = `${environment.API_URL}products/findById/${id}`;
    return this.http.get<Product>(url);
  }

  deleteProduct(id: string): Observable<Product> {
    const url = `${environment.API_URL}products/delete/${id}`;
    return this.http.delete<Product>(url);
  }
}