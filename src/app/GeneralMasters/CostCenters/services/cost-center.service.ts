import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CostCenter } from '../models/cost-center.model';
import { PageResponse, Page, convertToSimplePage } from '../models/page-response.model';

const API_URL = environment.API_URL + 'config/cost-centers/';

@Injectable({ providedIn: 'root' })
export class CostCenterService {
  private apiURL = API_URL;

  constructor(private http: HttpClient) {}

  // Listado paginado jerárquico - mantiene familias completas juntas
  findAll(enterpriseId: string, page = 0, size = 30, search = ''): Observable<Page<CostCenter>> {
    let url = `${this.apiURL}findAll/${enterpriseId}?page=${page}&size=${size}`;
    if (search && search.trim().length > 0) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    return this.http.get<PageResponse<CostCenter>>(url)
      .pipe(
        map(pageResponse => {
          const simplePage = convertToSimplePage(pageResponse);
          return simplePage;
        })
      );
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

  // Cambiar estado
  changeState(id: number, enterpriseId: string, status: boolean): Observable<any> {
    const url = `${this.apiURL}changeState/${id}/${enterpriseId}?status=${status}`;
    return this.http.patch<any>(url, {});
  }

  //Lista de centros de costo auxiliares activos   
  findActiveAuxiliary(enterpriseId: string): Observable<CostCenter[]> {
    return this.http.get<CostCenter[]>(`${this.apiURL}findAuxiliary/${enterpriseId}`);
  }

  /**
   * Exporta centros de costo a Excel.
   * 
   * @param enterpriseId ID de la empresa
   * @param companyName Nombre de la empresa (usado en el nombre del archivo)
   * @param status Estado del filtro (true=activos, false=inactivos, undefined=todos)
   * @returns Observable con la respuesta HTTP que contiene el blob del archivo Excel
   */
  exportToExcel(enterpriseId: string, companyName: string, status?: boolean): Observable<HttpResponse<Blob>> {
    let url = `${this.apiURL}export/excel/${enterpriseId}`;
    const params: string[] = [];
    
    // Agregar status si está definido (incluyendo false)
    if (status !== undefined && status !== null) {
      params.push(`status=${status}`);
    }
    
    // Agregar companyName si existe y no está vacío
    if (companyName && companyName.trim()) {
      params.push(`companyName=${encodeURIComponent(companyName.trim())}`);
    }
    
    // Construir URL final con parámetros
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url, { responseType: 'blob', observe: 'response' });
  }
}