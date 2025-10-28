import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Category } from '../Models/Category';

//interface temporal para simular la respuesta de la API
interface Cuenta {
  id: number;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  private cuentas: Cuenta[] = [
    {
      id: 1,
      name: 'Cuentas por cobrar',
      description: 'Cuentas por cobrar a clientes'
    },
    {
      id: 2,
      name: 'Cuentas por pagar',
      description: 'Cuentas por pagar a proveedores'
    },
    {
      id: 3,
      name: 'Caja',
      description: 'Caja chica'
    },
    {
      id: 4,
      name: 'Bancos',
      description: 'Cuentas bancarias'
    },
    {
      id: 5,
      name: 'Inventario',
      description: 'Inventario de productos'
    }
  ];

  constructor(private http: HttpClient) { }

  getCuentas(): Observable<Cuenta[]> {
    return of(this.cuentas);
  }

  getCuentaById(id: number): Observable<Cuenta> {
    const cuenta = this.cuentas.find(c => c.id === id) || {
      id: 0,
      name: '',
      description: ''
    };
    return of(cuenta);
  }

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

  // Método para obtener categorías activas con paginación
  findActivate(enterpriseId: string): Observable<any> {
    const params = new HttpParams()
      .set('enterpriseId', enterpriseId);

    const url = `${environment.API_URL}categories/findActivate`;
    return this.http.get(url, { params });
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
