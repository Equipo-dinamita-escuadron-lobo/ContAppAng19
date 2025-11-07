import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { ReceiptDetailsView } from '../Model/view/ReceiptView';
import { PaymentMethod } from '../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { AccountingEntryLine } from '../Model/AccountinEntryLine';
import { environment } from '../../../../../environments/environment';
import { AuxiliaryAccountOption, Client, DropdownOption, Invoice } from '../Model';
import { AccountingEntryResponse, ReceiptCreateRequest, ReceiptResponse, VoidReceiptRequest } from '../Model/api';
import { AccountingEntryView, AccountingMovementView, ReceiptView } from '../Model/view';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { Account } from '../../../../GeneralMasters/AccountCatalogue/models/ChartAccount';
import { ReceiptSummaryView } from '../../Reports/Model/Response/PortfolioView';

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {
  private apiUrl = environment.API_URL + 'payments';
  private accountingApiUrl = environment.API_URL + 'accountCatalogue/accounting'; // Nuevo URL para asientos contables

  private paymentMethodsCache: PaymentMethod[] = [];

  private mockClientsDB: Client[] = [
    { id: 1, name: 'Julian Ruano Majin', identification: '1102345678' },
    { id: 2, name: 'Maria Lopez', identification: '2202345678' },
    { id: 3, name: 'Pedro Gomez', identification: '3302345678' },
    { id: 4, name: 'Ana Fernandez', identification: '4402345678' },
    { id: 5, name: 'Julian Piamba', identification: '5502345678' },
    { id: 6, name: 'Juliana Campo', identification: '6602345678' }
  ];

  constructor(
    private http: HttpClient,
    private paymentMethodsService: PaymentMethodsServiceService,
    private ChartAccountService: ChartAccountService,
    private localStorageMethods: LocalStorageMethods) { }


  /**
   * Obtiene los métodos de pago desde la API y los almacena en caché.
   * Si ya están en caché, devuelve los datos almacenados.
   * @returns Un Observable con un array de métodos de pago.
   */
  private getPaymentMethods(): Observable<PaymentMethod[]> {
    if (this.paymentMethodsCache.length > 0) {
      return of(this.paymentMethodsCache);
    }

    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("No se encontró ID de la empresa en LocalStorage.");
      return of([]);
    }

    return this.paymentMethodsService.findAll(enterpriseId, 0, 100).pipe(
      map(page => {
        this.paymentMethodsCache = page.content;
        console.log("Métodos de pago obtenidos:", this.paymentMethodsCache);
        return this.paymentMethodsCache;
      })
    );
  }

  /**
   * Obtiene las cuentas contables auxiliares y las transforma al formato DropdownOption.
   * Este es el nuevo método que tu componente consumirá.
   * @param enterpriseId - El ID de la empresa para la cual se buscan las cuentas.
   * @returns Un Observable con un array de opciones para el dropdown.
   */
  getAuxiliaryAccountsCached(enterpriseId: string): Observable<AuxiliaryAccountOption[]> {
    return this.ChartAccountService.getListAuxiliaryAccounts(enterpriseId).pipe(
      map((accounts: Account[]) => {
        return accounts
          .filter(account => account.id !== undefined)
          .map(account => ({
            label: `${account.code} - ${account.description}`,
            codeAccount: account.code,
            description: account.description,
            value: account.id as number,
            costCenter: account.costCenter || null
          }));
      })
    );
  }


  /**
   *  Obtiene los tipos de recibo disponibles.
   * @returns Un Observable con un array de tipos de recibo.
   */
  getReceiptTypes(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: 'RC-1 - Recibo de Caja', value: 'RC-1' },
      { label: 'RC-2 - Recibo Bancario', value: 'RC-2' },
    ];
    return of(data);
  }

  /**
   * Obtiene las cuentas auxiliares disponibles.
   * @returns Un Observable con un array de cuentas auxiliares en formato DropdownOption.
   */
  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("No se encontró ID de la empresa en LocalStorage.");
      return of([]);
    }
    return this.getAuxiliaryAccountsCached(enterpriseId);
  }

  /**
   * Obtiene los clientes que coinciden con la consulta.
   * @param query La cadena de búsqueda para filtrar los clientes.
   * @returns Un Observable con un array de clientes filtrados.
   */
  getClients(query: string): Observable<Client[]> {
    const filteredClients = this.mockClientsDB.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredClients);
  }

  /**
   * Obtiene un cliente por su ID.
   * @param id El ID del cliente a buscar.
   * @returns Un Observable con el cliente encontrado o undefined.
   */
  public getClientById(id: number): Observable<Client | undefined> {
    const client = this.mockClientsDB.find(c => c.id === id);
    return of(client);
  }

  /**
   * Obtiene las facturas pendientes de un cliente.
   * @param clientId El ID del cliente cuyas facturas se desean obtener.
   * @returns Un Observable con un array de facturas pendientes.
   */
  getInvoicesByClient(clientId: number): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/pending/client/${clientId}`).pipe(
      map(invoicesFromApi => {
        return invoicesFromApi.map(invoice => ({
          ...invoice,
          dueDate: new Date(invoice.expirationDate)
        }));
      })
    );
  }


  /**
   * Obtiene todos los recibos de la empresa.
   * @returns Un Observable con un array de recibos.
   */
  getAllReceipts(): Observable<ReceiptView[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("ID de empresa no encontrado. No se pueden cargar los recibos.");
      return of([]);
    }

    return this.http.get<ReceiptResponse[]>(`${this.apiUrl}/by-enterprise/${enterpriseId}`).pipe(
      map(apiReceipts => {

        if (!apiReceipts) 
          return [];

        // 4. Transformar cada `ReceiptResponse` (de la API) en un `ReceiptView` (para la UI)
        return apiReceipts.map(receiptFromApi => {

          const client = this.mockClientsDB.find(c => c.id === receiptFromApi.thirdPartyId);

          return {
            id: receiptFromApi.id,
            receiptCode: receiptFromApi.receiptCode,
            issueDate: new Date(receiptFromApi.issueDate),
            thirdPartyId: receiptFromApi.thirdPartyId,
            clientName: client ? client.name : `ID: ${receiptFromApi.thirdPartyId}`,
            status: receiptFromApi.status === 'FINALIZED' ? 'Activo' : 'Anulado',
            totalAmount: receiptFromApi.totalAmount
          };
        });
      })
    );
  }

  /**
   * Obtiene un recibo por su ID.
   * @param id El ID del recibo a buscar.
   * @returns Un Observable con el recibo encontrado o undefined.
   */
  getReceiptById(id: number): Observable<ReceiptDetailsView | undefined> {
    return this.http.get<ReceiptResponse>(`${this.apiUrl}/${id}`).pipe(
      switchMap(receiptFromApi => {
        if (!receiptFromApi) {
          return of(undefined);
        }
        return forkJoin({
          receipt: of(receiptFromApi),
          client: this.getClientById(receiptFromApi.thirdPartyId),
          paymentMethod: this.getPaymentMethods().pipe(
            map(methods => methods.find(m => m.id === receiptFromApi.paymentMethodId))
          ),
          auxiliaryAccounts: this.getAuxiliaryAccounts() // Obtenemos las cuentas para buscar el nombre
        });
      }),
      map(result => {
        if (!result || !result.receipt) {
          return undefined;
        }

        const { receipt, client, paymentMethod, auxiliaryAccounts } = result;

        // 1. Construimos el objeto base 'ReceiptDetailView'
        const receiptDetailsView: ReceiptDetailsView = {
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          issueDate: new Date(receipt.issueDate),
          thirdPartyId: receipt.thirdPartyId,
          clientName: client ? client.name : `ID: ${receipt.thirdPartyId}`,
          paymentMethodName: paymentMethod ? paymentMethod.name : 'No especificado',
          status: receipt.status === 'FINALIZED' ? 'Activo' : 'Anulado',
          totalAmount: receipt.totalAmount,
          observations: receipt.observations,
          isDirectIncome: !receipt.details || receipt.details.length === 0,
          details: receipt.details.map(detail => ({
            invoiceId: detail.invoiceId,
            amountPaid: detail.amountPaid,
            invoiceCode: detail.invoiceCode,
            accountingAccount: detail.accountingAccount,
          })),
          paymentMethod: paymentMethod,
          ledgerAccountId: receipt.ledgerAccountId,
        };

        // 2. Generamos el asiento contable y lo adjuntamos
        receiptDetailsView.accountingEntry = this.generateAccountingEntry(receiptDetailsView, auxiliaryAccounts);

        return receiptDetailsView;
      })
    );
  }

  createReceipt(receiptData: ReceiptCreateRequest): Observable<ReceiptResponse> {
    return this.http.post<ReceiptResponse>(`${this.apiUrl}/`, receiptData);
  }

  voidReceipt(receiptId: number, reason: string): Observable<ReceiptResponse> {
    const requestBody: VoidReceiptRequest = { reason };
    return this.http.put<ReceiptResponse>(`${this.apiUrl}/${receiptId}/void`, requestBody);
  }

  public generateAccountingEntry(receipt: ReceiptDetailsView, auxAccounts: DropdownOption[]): AccountingEntryLine[] {
    const entry: AccountingEntryLine[] = [];
    const total = receipt.totalAmount;
    const thirdPartyName = receipt.clientName;

    if (receipt.paymentMethod && receipt.paymentMethod.accountingAccount) {
      entry.push({
        accountCode: receipt.paymentMethod.accountingAccount,
        accountName: receipt.paymentMethod.name,
        thirdParty: thirdPartyName,
        debit: total,
        credit: 0,
        description: `Ingreso de dinero en ${receipt.paymentMethod.name}`
      });
    } else {
      console.error("No se pudo generar el débito: Método de pago o su cuenta no encontrados.");
    }

    if (receipt.isDirectIncome) {
      const auxAccount = auxAccounts.find(acc => acc.value === receipt.ledgerAccountId);
      entry.push({
        accountCode: receipt.ledgerAccountId?.toString() || 'N/A',
        accountName: auxAccount ? auxAccount.label : 'Ingreso No Operacional',
        thirdParty: thirdPartyName,
        debit: 0,
        credit: total,
        description: `Ingreso directo ${receipt.receiptCode}`
      });
    } else {
      receipt.details.forEach(detail => {
        entry.push({
          accountCode: detail.accountingAccount.toString(),
          accountName: 'Cuentas por Cobrar Clientes',
          thirdParty: thirdPartyName,
          debit: 0,
          credit: detail.amountPaid,
          description: `Abono Factura ${detail.invoiceCode}`
        });
      });
    }

    if (receipt.status === 'Anulado') {
      const reversedEntry = entry.map(line => ({
        ...line,
        debit: line.credit,
        credit: line.debit,
        description: `Anulación: ${line.description}`
      }));
      return reversedEntry;
    }

    return entry;
  }

  getReceiptsByInvoice(invoiceId: number): Observable<ReceiptSummaryView[]> {
  const url = `${environment.API_URL}accountCatalogue/portfolio/receipts/by-invoice/${invoiceId}`;
  return this.http.get<ReceiptSummaryView[]>(url);
}

}