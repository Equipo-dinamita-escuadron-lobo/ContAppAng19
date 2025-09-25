import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Receipt } from '../Model/Receipt';
import { ReceiptDetailsView } from '../Model/view/ReceiptView';
import { PaymentMethod } from '../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { AccountingEntryLine } from '../Model/AccountinEntryLine';
import { environment } from '../../../../../environments/environment';
import { Client, DropdownOption, Invoice } from '../Model';
import { ReceiptCreateRequest, ReceiptResponse, VoidReceiptRequest } from '../Model/api';
import { ReceiptView } from '../Model/view';

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {
  private apiUrl = environment.API_URL + 'payments';

  private paymentMethodsCache: PaymentMethod[] = [];

  private mockClientsDB: Client[] = [
    { id: 1, name: 'Julian Ruano Majin', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 2, name: 'Maria Lopez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 3, name: 'Pedro Gomez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 4, name: 'Ana Fernandez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 5, name: 'Julian Piamba', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 6, name: 'Juliana Campo', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } }
  ];

  private mockInvoicesDB: Invoice[] = [
    { id: 1, factCode: 'FV-2-10000', expirationDate: new Date('2025-06-20'), pendingValue: 1200000 },
    { id: 2, factCode: 'FV-2-10001', expirationDate: new Date('2025-07-15'), pendingValue: 500000 },
    { id: 3, factCode: 'FV-2-10002', expirationDate: new Date('2025-08-10'), pendingValue: 750000 },
  ];

  constructor(
    private http: HttpClient,
    private paymentMethodsService: PaymentMethodsServiceService,
    private localStorageMethods: LocalStorageMethods) { }


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

  getReceiptTypes(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: 'RC-1 - Recibo de Caja', value: 'RC-1' },
      { label: 'RC-2 - Recibo Bancario', value: 'RC-2' },
    ];
    return of(data);
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/types`);
  }

  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: '413536 - Venta de servicios', value: 413536 },
      { label: '421005 - Ingresos no operacionales', value: 421005 },
    ];
    return of(data);
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/auxiliary-accounts`);
  }

  getClients(query: string): Observable<Client[]> {
    const filteredClients = this.mockClientsDB.filter(client =>
      client.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredClients);
  }

  public getClientById(id: number): Observable<Client | undefined> {
    const client = this.mockClientsDB.find(c => c.id === id);
    return of(client);
  }

  getInvoicesByClient(clientId: number): Observable<Invoice[]> {
    // 1. Hacemos la llamada HTTP a la nueva URL.
    return this.http.get<Invoice[]>(`${this.apiUrl}/pending/client/${clientId}`).pipe(
      // 2. (Opcional pero recomendado) Transformamos los datos recibidos.
      map(invoicesFromApi => {
        // La API envía las fechas como strings (ej: "2023-10-27").
        // Es una buena práctica convertirlas a objetos Date de JS para que
        // componentes como p-calendar funcionen correctamente.
        return invoicesFromApi.map(invoice => ({
          ...invoice,
          dueDate: new Date(invoice.expirationDate) // Convertimos el string de fecha a un objeto Date
        }));
      })
    );
  }


  // --- MÉTODOS PARA EL CRUD DE RECIBOS ---
  getAllReceipts(): Observable<ReceiptView[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("ID de empresa no encontrado. No se pueden cargar los recibos.");
      return of([]);
    }

    return this.http.get<ReceiptResponse[]>(`${this.apiUrl}/by-enterprise/${enterpriseId}`).pipe(
      map(apiReceipts => {

        if (!apiReceipts) {
          return [];
        }

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
          // --- Pasamos la información extra necesaria para la contabilidad ---
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
    // --- PASO 1: Generar el asiento como si estuviera ACTIVO (usando tu lógica) ---
    const entry: AccountingEntryLine[] = [];
    const total = receipt.totalAmount;
    const thirdPartyName = receipt.clientName;

    // LÍNEA DEL DÉBITO (Lo que entra a la empresa)
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

    // LÍNEAS DEL CRÉDITO (El origen del dinero)
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

    // --- PASO 2: Si el recibo está anulado, INVERTIR el asiento generado ---
    if (receipt.status === 'Anulado') {
        const reversedEntry = entry.map(line => ({
            ...line, // Copia todas las propiedades: accountCode, accountName, thirdParty
            debit: line.credit, // El nuevo débito es el valor del crédito original
            credit: line.debit, // El nuevo crédito es el valor del débito original
            description: `Anulación: ${line.description}` // Se añade un prefijo para mayor claridad
        }));
        return reversedEntry;
    }

    return entry;
}
}