import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { NatureType } from '../models/NatureType';
import { FinancialStateType } from '../models/FinancialStateType';
import { ClasificationType } from '../models/ClasificationType';
import { Observable, map, catchError, of } from 'rxjs';
import { Account, AccountCatalogueListRes, ItemAccountCatalogueSearchRes, AccountCatalogueCreateRes, AccountCatalogueUpdateRes } from '../models/ChartAccount';


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
    return this.http.get<AccountCatalogueListRes[]>(this.apiURL + 'trees/' + entId).pipe(
      map(response => this.convertAccountCatalogueListResToAccount(response, entId))
    );
  }

  /**
   * Convierte la respuesta del backend AccountCatalogueListRes[] a Account[]
   * 
   * @param accountList - Lista de cuentas del backend
   * @param entId - ID de la empresa
   * @returns Array de cuentas convertidas
   */
  private convertAccountCatalogueListResToAccount(accountList: AccountCatalogueListRes[], entId: string): Account[] {
    if (!accountList || accountList.length === 0) {
      return [];
    }

    return accountList.map(item => this.mapAccountCatalogueToAccount(item, entId));
  }

  /**
   * Mapea recursivamente AccountCatalogueListRes a Account
   * 
   * @param item - Item del backend
   * @param entId - ID de la empresa
   * @returns Cuenta mapeada
   */
  private mapAccountCatalogueToAccount(item: AccountCatalogueListRes, entId: string): Account {
    return {
      id: item.id,
      idEnterprise: entId,
      code: item.code,
      description: item.description,
      nature: item.nature,
      financialStatus: item.financialStatus,
      classification: item.classification,
      parent: item.parent,
      children: item.children ? item.children.map(child => this.mapAccountCatalogueToAccount(child, entId)) : [],
      showSubAccounts: false
    };
  }

  /**
     * Elimina una cuenta por su ID.
     * 
     * @param id - El ID de la cuenta a eliminar.
     * @returns Un observable que indica si la eliminación fue exitosa.
     */
  deleteAccount(id: string): Observable<void> {
    return this.http.delete<void>(this.apiURL + id);
  }

  /**
     * Crea una nueva cuenta.
     * 
     * @param account - La cuenta a crear.
     * @returns Un observable de la cuenta creada.
     */
  createAccount(account: Account): Observable<Account> {
    return this.http.post<AccountCatalogueCreateRes>(this.apiURL, account).pipe(
      map(response => this.mapCreateResponseToAccount(response))
    );
  }

  /**
   * Mapea AccountCatalogueCreateRes a Account
   * 
   * @param item - Item de respuesta del backend
   * @returns Cuenta mapeada
   */
  private mapCreateResponseToAccount(item: AccountCatalogueCreateRes): Account {
    return {
      id: item.id,
      idEnterprise: item.idEnterprise,
      code: item.code,
      description: item.description,
      nature: item.nature,
      financialStatus: item.financialStatus,
      classification: item.classification,
      parent: item.parent,
      children: [],
      showSubAccounts: false
    };
  }

  /**
     * Actualiza una cuenta existente.
     * 
     * @param id - El ID de la cuenta a actualizar.
     * @param account - La información actualizada de la cuenta.
     * @returns Un observable de la cuenta actualizada.
     */
  updateAccount(id?: number, account?: Account): Observable<Account> {
    return this.http.put<AccountCatalogueUpdateRes>(`${this.apiURL}${id}`, account).pipe(
      map(response => this.mapUpdateResponseToAccount(response, account?.idEnterprise || ''))
    );
  }

  /**
   * Mapea AccountCatalogueUpdateRes a Account
   * 
   * @param item - Item de respuesta del backend
   * @param entId - ID de la empresa
   * @returns Cuenta mapeada
   */
  private mapUpdateResponseToAccount(item: AccountCatalogueUpdateRes, entId: string): Account {
    return {
      id: item.id,
      idEnterprise: entId,
      code: item.code,
      description: item.description,
      nature: item.nature,
      financialStatus: item.financialStatus,
      classification: item.classification,
      parent: item.parent,
      children: [],
      showSubAccounts: false
    };
  }


  /**
   * Obtiene una cuenta por su código y el ID de entidad.
   * Si la cuenta no existe (404), devuelve null silenciosamente sin errores en consola.
   * 
   * @param code - El código de la cuenta a obtener.
   * @param entId - El ID de la entidad a la que pertenece la cuenta.
   * @returns Un observable de la cuenta obtenida o null si no existe.
   */
  getAccountByCode(code: string | number, entId: string): Observable<Account | null> {
    return this.http.get<ItemAccountCatalogueSearchRes>(this.apiURL + 'accountByCode/' + code + '/' + entId).pipe(
      map(response => this.mapItemAccountToAccount(response, entId)),
      catchError((error: HttpErrorResponse) => {
        // Silenciosamente devuelve null para errores 404 (cuenta no encontrada)
        if (error.status === 404) {
          return of(null);
        }
        // Para otros errores, propaga el error
        throw error;
      })
    );
  }

  /**
   * Verifica si una cuenta existe sin cargar datos completos ni mostrar errores.
   * Usa método HEAD para verificar existencia sin transferir contenido.
   * 
   * @param code - El código de la cuenta a verificar.
   * @param entId - El ID de la entidad a la que pertenece la cuenta.
   * @returns Un observable boolean que indica si la cuenta existe.
   */
  checkAccountExists(code: string | number, entId: string): Observable<boolean> {
    // Usamos HEAD para verificar existencia sin cargar el contenido
    return this.http.head(
      this.apiURL + 'accountByCode/' + code + '/' + entId,
      { observe: 'response' }
    ).pipe(
      map(response => response.status === 200), // Si status es 200, la cuenta existe
      catchError((error: HttpErrorResponse) => {
        // Para cualquier error (incluyendo 404), consideramos que no existe
        return of(false);
      })
    );
  }

  /**
   * Mapea ItemAccountCatalogueSearchRes a Account
   * 
   * @param item - Item del backend
   * @param entId - ID de la empresa
   * @returns Cuenta mapeada
   */
  private mapItemAccountToAccount(item: ItemAccountCatalogueSearchRes, entId: string): Account {
    return {
      id: item.id,
      idEnterprise: entId,
      code: item.code,
      description: item.description,
      nature: item.nature,
      financialStatus: item.financialStatus,
      classification: item.classification,
      parent: item.parent,
      children: [],
      showSubAccounts: false
    };
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
