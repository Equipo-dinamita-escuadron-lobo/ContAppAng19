import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Client, DropdownOption, Invoice, ReceiptView } from '../Model/Models';
import { Receipt } from '../Model/Receipt';
import { ReceiptDetailsView } from '../Model/ReceiptView';
import { PaymentMethod } from '../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { AccountingEntryLine } from '../Model/AccountinEntryLine';
import { environment } from '../../../../../environments/environment';
import { ReceiptResponse } from '../Model/ReceiptResponse';
import { ReceiptCreateRequest } from '../Model/ReceiptCreateRequest';
import { VoidReceiptRequest } from '../Model/VoidReceiptRequest';

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
    const enterpriseId = "asdasdasfafa";
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

        // 2. Preparamos las llamadas para obtener los datos adicionales. forkJoin las ejecutará en paralelo para mayor eficiencia.
        return forkJoin({
          receipt: of(receiptFromApi), // Pasamos el recibo original
          client: this.getClientById(receiptFromApi.thirdPartyId),
          // Para el método de pago, primero obtenemos todos y luego buscamos.
          /*paymentMethod: this.getPaymentMethods().pipe(
              map(methods => methods.find(m => m.id === receiptFromApi.paymentMethodId))
          )*/
        });
      }),
      map(result => {
        // Si en el paso anterior algo falló, result será null.
        if (!result) {
          return undefined;
        }

        //const { receipt, client, paymentMethod } = result;
        const { receipt, client } = result;

        // 3. Construimos el objeto final 'ReceiptDetailsView' que el componente necesita.
        const receiptDetailsView: ReceiptDetailsView = {
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          issueDate: new Date(receipt.issueDate), // Convertimos el string de la API a Date
          thirdPartyId: receipt.thirdPartyId,
          clientName: client ? client.name : 'Cliente no encontrado',
          //paymentMethodName: paymentMethod ? paymentMethod.name : 'No especificado',
          paymentMethodName: 'No especificado',
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
          accountingEntry: [] // Lo dejamos vacío por ahora, ya que el backend no lo provee.
        };

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

  private _generateAccountingEntry(receipt: Receipt, paymentMethods: PaymentMethod[]): AccountingEntryLine[] {
    const entry: AccountingEntryLine[] = [];
    const total = receipt.totalAmount || 0;
    const thirdPartyId = receipt.thirdPartyId || 0;
    const client = this.mockClientsDB.find(c => c.id === thirdPartyId);

    // LÍNEA DEL DÉBITO
    const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);
    if (!paymentMethod || !paymentMethod.accountingAccount) {
      console.error("Método de pago o su cuenta contable no encontrados.");
      return [];
    }
    entry.push({
      accountCode: paymentMethod.accountingAccount,
      accountName: paymentMethod.name, // <-- CAMBIO: Usamos el nombre directo (Ej: 'Caja')
      debit: total,
      credit: 0,
      thirdPartyId: thirdPartyId,
      description: receipt.observations || 'Efectivo' // <-- CAMBIO: Usamos las observaciones o un genérico
    });

    // LÍNEAS DEL CRÉDITO
    const isDirectIncome = !receipt.details || receipt.details.length === 0;

    if (isDirectIncome) {
      // ... (lógica para ingreso directo)
    } else {
      if (!client) {
        console.error("Cliente no encontrado para generar asiento de cartera.");
        return [];
      }
      receipt.details?.forEach(detail => {
        const invoice = this.mockInvoicesDB.find(inv => inv.id === detail.invoiceId);
        const invoiceCode = invoice ? invoice.factCode : `ID ${detail.invoiceId}`;

        entry.push({
          accountCode: client.accountsReceivableAccount.code,
          accountName: client.accountsReceivableAccount.name, // <-- Usará 'Cliente' del mock
          debit: 0,
          credit: detail.amountPaid,
          thirdPartyId: thirdPartyId,
          description: invoiceCode // <-- CAMBIO: La descripción es solo el código de la factura
        });
      });
    }
    return entry;
  }
}