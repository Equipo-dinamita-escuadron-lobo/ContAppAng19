import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { UnitOfMeasure } from '../Models/UnitOfMeasure';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

let API_URL = environment.API_URL;

@Injectable({
  providedIn: 'root'
})
export class UnitOfMeasureService {

  constructor(private readonly http: HttpClient) { }

 
  // Método para obtener todas las unidades de medida con paginación
  findAll(enterpriseId: string, page = 0, size = 10, sortField = 'name', sortOrder = 'asc', search = ''): Observable<Page<UnitOfMeasure>> {
    let url = `${API_URL}unit-measures/findAll?enterpriseId=${enterpriseId}&numPage=${page}&size=${size}&sortField=${sortField}&sortOrder=${sortOrder}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<Page<UnitOfMeasure>>(url);
  }

  // Método para obtener todas las unidades de medida activas (para dropdowns)
  findActivate(enterpriseId: string): Observable<UnitOfMeasure[]> {
    const url = `${API_URL}unit-measures/findActivate?enterpriseId=${enterpriseId}`;
    return this.http.get<Page<UnitOfMeasure>>(url).pipe(
      map((page: Page<UnitOfMeasure>) => page.content)
    );
  }

  // Método para obtener por Id las unidades de medida
  getUnitOfMeasuresId(id: string, enterpriseId: string): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/findById/${id}?enterpriseId=${enterpriseId}`;
    return this.http.get<UnitOfMeasure>(url);
  }


  // Método para actualizar una Unidad de medida existente por ID
  updateUnitOfMeasureId(id: string, unitOfMeasure: UnitOfMeasure, enterpriseId: string): Observable<UnitOfMeasure> {    
    const url = `${API_URL}unit-measures/update/${id}`;
    return this.http.put<UnitOfMeasure>(url, unitOfMeasure);
  }

  // Método para cambiar el estado de una Unidad de medida
  unitOfMeasureChangeState(id: string, enterpriseId: string): Observable<UnitOfMeasure> {    
    const url = `${API_URL}unit-measures/changeState/${id}?enterpriseId=${enterpriseId}`;
    return this.http.put<UnitOfMeasure>(url, {});
  }


  // Método para crear una nueva unidad de medida
  createUnitOfMeasure(unitOfMeasure: UnitOfMeasure): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/create`;
    return this.http.post<UnitOfMeasure>(url, unitOfMeasure);
  }

  // Método para Eliminar una Unidad de medida existente por ID
  deleteUnitOfMeasureId(id: string, enterpriseId: string): Observable<UnitOfMeasure> {
    const url = `${API_URL}unit-measures/delete/${id}?enterpriseId=${enterpriseId}`;
    return this.http.delete<UnitOfMeasure>(url);
  }
}
