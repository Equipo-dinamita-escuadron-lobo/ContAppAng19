import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Category } from '../Models/Category';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) { }

   // Método para obtener todas las categorías
  getCategories(enterpriseId:string): Observable<Category[]> {
    const url = `${environment.API_URL}categories/findAll/${enterpriseId}`;
    return this.http.get<Category[]>(url);
  }
}
