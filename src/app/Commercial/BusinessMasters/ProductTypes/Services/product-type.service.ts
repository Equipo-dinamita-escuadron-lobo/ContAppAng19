import { Injectable } from '@angular/core';
import { ProductType } from '../../Products/Models/ProductType';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})


export class ProductTypeService {
   private readonly apiUrl = `${environment.API_URL}product-types`; // Cambia esta URL según tu configuración
  constructor(private http: HttpClient) { }

   // GET: Obtener todos los tipos de producto
  getAllProductTypes(): Observable<ProductType[]> {
    return this.http.get<ProductType[]>(this.apiUrl);
  }
}
