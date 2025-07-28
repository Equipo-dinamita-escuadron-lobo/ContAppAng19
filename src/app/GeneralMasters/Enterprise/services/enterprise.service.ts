import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Enterprise } from '../models/enterprise';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { EnterpriseList } from '../models/EnterpriseList';
import { EnterpriseDetails } from '../models/EnterpriseDetails';
import { LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';

let API_URL = environment.API_URL + 'enterprises/';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  private apiUrl = API_URL;

  getEnterprisesActive(): Observable<EnterpriseList[]> {
    return this.http.get<EnterpriseList[]>(this.apiUrl);
  }

  getEnterprisesInactive(): Observable<EnterpriseList[]> {
    return this.http.get<EnterpriseList[]>(this.apiUrl + 'inactive');
  }

  constructor(private http: HttpClient) { }

  //METODOS PARA OBTENER INFORTMACION DE LA EMPRESA SELECCIONADA
  /** Métodos de almacenamiento local */
  localStorageMethods: LocalStorageMethods = new LocalStorageMethods();

  /**
   * Obtiene la empresa seleccionada del almacenamiento local
   * @returns ID de la empresa seleccionada
   */
  getSelectedEnterprise() {
    return this.localStorageMethods.loadEnterpriseData();
  }

  /**
   * Obtiene una empresa por su ID
   * @param id Identificador de la empresa
   * @returns Observable con los detalles de la empresa
   */
  getEnterpriseById(id: string): Observable<EnterpriseDetails> {
    const url = `${this.apiUrl}enterprise/${id}`;
    return this.http.get<EnterpriseDetails>(url);
  }

  /**
   * Crea una nueva empresa
   * @param enterprise Datos de la empresa a crear
   * @returns Observable con la empresa creada
   */
  createEnterprise(enterprise: EnterpriseDetails): Observable<EnterpriseDetails> {
    return this.http.post<EnterpriseDetails>(this.apiUrl, enterprise);
  }

  /**
   * Actualiza una empresa existente
   * @param id ID de la empresa
   * @param enterprise Datos actualizados de la empresa
   * @returns Observable con la empresa actualizada
   */
  updateEnterprise(id: string, enterprise: EnterpriseDetails): Observable<EnterpriseDetails> {
    const url = `${this.apiUrl}${id}`;
    return this.http.put<EnterpriseDetails>(url, enterprise);
  }

  /**
   * Elimina una empresa
   * @param id ID de la empresa a eliminar
   * @returns Observable vacío
   */
  deleteEnterprise(id: string): Observable<void> {
    const url = `${this.apiUrl}${id}`;
    return this.http.delete<void>(url);
  }

}
