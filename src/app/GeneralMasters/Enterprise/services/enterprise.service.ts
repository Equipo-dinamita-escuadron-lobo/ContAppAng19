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
  private enterprisesSubject = new BehaviorSubject<Enterprise[]>([]);
  public enterprises$ = this.enterprisesSubject.asObservable();
  private apiUrl = API_URL;

  getEnterprisesActive(): Observable<EnterpriseList[]> {
    return this.http.get<EnterpriseList[]>(this.apiUrl);
  }

  getEnterprisesInactive(): Observable<EnterpriseList[]> {
    return this.http.get<EnterpriseList[]>(this.apiUrl + 'inactive');
  }

  constructor(private http: HttpClient) { }

  // getEnterprises(): Enterprise[] {
  //   const enterprises: Enterprise[] = [
  //     { nombre: 'Adidas', nit: '1234567890' },
  //     { nombre: 'Nike', nit: '0987654321' },
  //     { nombre: 'D1', nit: '9988776655' },
  //     { nombre: 'Exito', nit: '2233445566' },
  //   ];
  //   this.enterprisesSubject.next(enterprises);
  //   return enterprises;
  // }


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


}
