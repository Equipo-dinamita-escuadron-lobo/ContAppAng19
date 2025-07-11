import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { NatureType } from '../models/NatureType';
import { FinancialStateType } from '../models/FinancialStateType';
import { ClasificationType } from '../models/ClasificationType';
import { Observable } from 'rxjs';
import { Account } from '../models/ChartAccount';


let API_URL = environment.API_URL + 'accountCatalogue/';

// Establece la URL de la API según el microservicio configurado en el entorno.
// Si el microservicio es 'accountCatalogue', se usa la URL local; de lo contrario, se usa la URL predeterminada.
/*if (environment.microservice == 'accountCatalogue') {
  API_URL = environment.API_LOCAL_URL;
}
else {
  API_URL = environment.API_URL;
}*/

@Injectable({
  providedIn: 'root'
})
export class ChartAccountService {

  // URL para la API del catálogo de cuentas.
  // Se utiliza la URL de producción si está habilitada, o la URL local si es necesario.
  // Descomentar la línea correspondiente según el entorno de ejecución.
  private apiURL = API_URL
  //Local
  //private apiURL = myAppUrl + 'accountCatalogue'

  constructor(private http: HttpClient) { }

  /**
     * Lista predefinida de tipos de naturaleza para las cuentas.
     * 
     * @type {NatureType[]} - Un array de objetos que representa los tipos de naturaleza disponibles ('Débito' y 'Crédito'), cada uno con un identificador único.
     */
  listNature: NatureType[] = [
    { id: 1, name: 'Débito' },
    { id: 2, name: 'Crédito' }
  ];

  /**
     * Lista predefinida de tipos de estados financieros.
     * 
     * @type {FinancialStateType[]} - Un array de objetos que representa los tipos de estados financieros disponibles ('Estado de Resultados' y 'Estado de Situación Financiera'), cada uno con un identificador único.
     */
  listFinancialState: FinancialStateType[] = [
    { id: 1, name: 'Estado de Resultados' },
    { id: 2, name: 'Estado de Situacion Financiero' }
  ];

  /**
     * Lista predefinida de tipos de clasificación financiera.
     * 
     * @type {ClasificationType[]} - Un array de objetos que representa los tipos de clasificación disponibles, incluyendo activos, pasivos, patrimonio, ingresos y gastos, cada uno con un identificador único.
     */
  listClasification: ClasificationType[] = [
    { id: 1, name: 'Activo Corriente' },
    { id: 2, name: 'Activo No Corriente' },
    { id: 3, name: 'Pasivo Corriente' },
    { id: 4, name: 'Pasivo No Corriente' },
    { id: 5, name: 'Patrimonio' },
    { id: 6, name: 'Ingresos No Operacionales' },
    { id: 7, name: 'Gastos Operacionales' },
    { id: 8, name: 'Ingresos Operacionales' }
  ];

  /**
     * Obtiene una lista de cuentas para un ID de entidad dado.
     * 
     * @param entId - El ID de la entidad para la cual se desean obtener las cuentas.
     * @returns Un observable que emite un array de cuentas.
     */
  getListAccounts(entId: string): Observable<Account[]> {
    return this.http.get<Account[]>(this.apiURL + 'trees/' + entId);
  }

  /**
     * Elimina una cuenta por su código.
     * 
     * @param code - El código de la cuenta a eliminar.
     * @returns Un observable de la cuenta eliminada.
     */
  deleteAccount(code: string): Observable<Account> {
    return this.http.delete<Account>(this.apiURL + code);
  }

  /**
     * Crea una nueva cuenta.
     * 
     * @param account - La cuenta a crear.
     * @returns Un observable de la cuenta creada.
     */
  createAccount(account: Account): Observable<Account> {
    return this.http.post<Account>(this.apiURL, account);
  }

  /**
     * Actualiza una cuenta existente.
     * 
     * @param id - El ID de la cuenta a actualizar.
     * @param account - La información actualizada de la cuenta.
     * @returns Un observable de la cuenta actualizada.
     */
  updateAccount(id?: number, account?: Account): Observable<Account> {
    return this.http.put<Account>(`${this.apiURL}${id}`, account);
  }

  /**
     * Obtiene una cuenta por su código y el ID de entidad.
     * 
     * @param code - El código de la cuenta a obtener.
     * @param entId - El ID de la entidad a la que pertenece la cuenta.
     * @returns Un observable de la cuenta obtenida.
     */
  getAccountByCode(code: string | number, entId: string): Observable<Account> {
    return this.http.get<Account>(this.apiURL + 'accountByCode/' + code + '/' + entId);
  }

  /**
     * Obtiene la lista de tipos de clasificación.
     * 
     * @returns Un array de tipos de clasificación.
     */
  getClasificationType(): ClasificationType[] {
    return this.listClasification;
  }

  /**
 * Obtiene la lista de tipos de naturaleza.
 * 
 * @returns Un array de tipos de naturaleza.
 */
  getNatureType(): NatureType[] {
    return this.listNature;
  }

  /**
   * Obtiene la lista de tipos de estados financieros.
   * 
   * @returns Un array de tipos de estados financieros.
   */
  getFinancialStateType(): FinancialStateType[] {
    return this.listFinancialState;
  }
}
