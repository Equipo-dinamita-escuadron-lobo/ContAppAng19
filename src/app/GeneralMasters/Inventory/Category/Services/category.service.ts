import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Category } from '../Models/Category';

interface Page<T> {
  content: T[];
  page: {
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  
  constructor(private readonly http: HttpClient) { }

  // Método para obtener todas las categorías con paginación, búsqueda y ordenamiento
  findAll(enterpriseId: string, page: number, size: number, sortField: string, sortOrder: string, search?: string): Observable<any> {
    let params = new HttpParams()
      .set('enterpriseId', enterpriseId)
      .set('numPage', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('sortOrder', sortOrder);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    const url = `${environment.API_URL}categories/findAll`;
    return this.http.get(url, { params });
  }

  // Método para obtener categorías activas
  findActivate(enterpriseId: string): Observable<Category[]> {
    const params = new HttpParams()
      .set('enterpriseId', enterpriseId);

    const url = `${environment.API_URL}categories/findActivate`;
    return this.http.get<Page<Category>>(url, { params }).pipe(
      map((page: Page<Category>) => page.content)
    );
  }

  // Método para obtener una categoría por su ID
  getCategoryById(id: string, enterpriseId: string): Observable<Category> {
    const url = `${environment.API_URL}categories/findById/${enterpriseId}/${id}`;
    return this.http.get<Category>(url);
  }

  // Método para crear una nueva categoría
  createCategory(category: Category): Observable<Category> {
    const url = `${environment.API_URL}categories/create`;
    return this.http.post<Category>(url, category);
  }

  // Método para actualizar una categoría existente
  updateCategory(category: Category, enterpriseId: string): Observable<Category> {
    const url = `${environment.API_URL}categories/update/${enterpriseId}/${category.id}`;
    return this.http.put<Category>(url, category);
  }

  // Método para eliminar una categoría
  deleteCategory(id: string, enterpriseId: string): Observable<Category> {
    const url = `${environment.API_URL}categories/delete/${enterpriseId}/${id}`;
    return this.http.delete<Category>(url);
  }

  // Método para cambiar el estado de una categoría
  changeCategoryState(id: number, enterpriseId: string): Observable<any> {
    const url = `${environment.API_URL}categories/changeState/${enterpriseId}/${id}`;
    return this.http.put(url, {});
  }
}
