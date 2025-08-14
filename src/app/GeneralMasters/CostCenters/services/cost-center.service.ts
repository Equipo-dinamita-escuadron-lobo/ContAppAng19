import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CostCenter } from '../models/cost-center.model';

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const API_URL = environment.API_URL + 'config/cost-centers/';

@Injectable({ providedIn: 'root' })
export class CostCenterService {
  private apiURL = API_URL;

  constructor(private http: HttpClient) {}

  // Listado paginado por enterprise (por defecto, tamaño grande para traer todo)
  findAll(enterpriseId: string, page = 0, size = 1000): Observable<Page<CostCenter>> {
    return this.http.get<Page<CostCenter>>(`${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}`);
  }

  // Crear
  create(payload: CostCenter): Observable<CostCenter> {
    return this.http.post<CostCenter>(`${this.apiURL}create`, payload);
  }

  // Actualizar
  update(payload: CostCenter): Observable<CostCenter> {
    return this.http.put<CostCenter>(`${this.apiURL}update`, payload);
  }

  // Eliminar
  delete(id: number, enterpriseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiURL}delete/${id}/${enterpriseId}`);
  }

  // Obtener por id
  findById(id: number, enterpriseId: string): Observable<CostCenter> {
    return this.http.get<CostCenter>(`${this.apiURL}findById/${id}/${enterpriseId}`);
  }
}


