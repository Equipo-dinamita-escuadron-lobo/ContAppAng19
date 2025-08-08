import { HttpClient } from '@angular/common/http';
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

  // Método para obtener todas las categorías
  getCategories(enterpriseId: string): Observable<Category[]> {
    const url = `${environment.API_URL}categories/findAll/${enterpriseId}`;
    return this.http.get<Category[]>(url);
  }

  // Método para obtener una categoría por su ID
  getCategoryById(id: string): Observable<Category> {
    const url = `${environment.API_URL}categories/findById/${id}`;
    return this.http.get<Category>(url);
  }

  // Método para crear una nueva categoría
  createCategory(category: Category): Observable<Category> {
    const url = `${environment.API_URL}categories/create`;
    return this.http.post<Category>(url, category);
  }

  // Método para actualizar una categoría existente
  updateCategory(category: Category): Observable<Category> {
    const url = `${environment.API_URL}categories/update/${category.id}`;
    return this.http.put<Category>(url, category);
  }

  // Método para eliminar una categoría
  deleteCategory(id: string): Observable<Category> {
    const url = `${environment.API_URL}categories/delete/${id}`;
    return this.http.delete<Category>(url);
  }

  // Método para cambiar el estado de una categoría
  changeCategoryState(id: number): Observable<any> {
    const url = `${environment.API_URL}categories/changeState/${id}`;
    return this.http.put(url, {});
  }
}
