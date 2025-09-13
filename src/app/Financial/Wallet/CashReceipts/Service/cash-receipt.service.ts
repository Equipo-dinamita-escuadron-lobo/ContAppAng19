import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, map, Observable, of, switchMap } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {
  private apiUrl = environment.API_URL + 'payments';

  private paymentMethodsCache: PaymentMethod[] = [];

  private mockReceiptsDB: Receipt[] = [
    {
      id: 1, receiptCode: 'RC-1-10000', thirdPartyId: 101, status: 'Activo', issueDate: new Date('2025-06-20'),
      totalAmount: 2400000, observations: 'Abono a facturas pendientes de pago.',
      details: [
        { invoiceId: 1, amountPaid: 1200000 },
        { invoiceId: 2, amountPaid: 600000 },
        { invoiceId: 3, amountPaid: 600000 }
      ],
      paymentMethodId: 1,
      accountingEntry: [
        { accountCode: '110505', accountName: 'Caja General', debit: 2400000, credit: 0, thirdPartyId: 101, description: 'Pago recibido del cliente' },
        { accountCode: '130505', accountName: 'Clientes Nacionales', debit: 0, credit: 2400000, thirdPartyId: 101, description: 'Abono a facturas FV-2-10000, FV-2-10001, FV-2-10002' }
      ]
    },
    {
      id: 7, receiptCode: 'RC-1-10006', thirdPartyId: 102, status: 'Activo', issueDate: new Date('2025-05-30'),
      totalAmount: 95000, observations: 'Ingreso directo por concepto de servicios varios.',
      details: [],
      paymentMethodId: 2,
      auxAccount: 413536, // Ejemplo de cuenta de ingreso
      accountingEntry: [
        { accountCode: '111005', accountName: 'Bancos Nacionales', debit: 95000, credit: 0, thirdPartyId: 102, description: 'Ingreso recibido del cliente' },
        { accountCode: '413536', accountName: 'Venta de servicios', debit: 0, credit: 95000, thirdPartyId: 102, description: 'Servicios varios prestados' }
      ]
    },
  ];

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

/*
  getInvoicesByClient(clientId: number): Observable<Invoice[]> {
    let invoices: Invoice[] = [];
    if (clientId === 101) {
      invoices = [
        { id: 1, factCode: 'FV-2-10000', expirationDate: new Date('2025-06-20'), pendingValue: 1200000 },
        { id: 2, factCode: 'FV-2-10001', expirationDate: new Date('2025-07-15'), pendingValue: 500000 },
        { id: 3, factCode: 'FV-2-10002', expirationDate: new Date('2025-08-10'), pendingValue: 750000 },
      ];
    }

    return of(invoices);
    // TODO: Cuando conectes al backend:
    // return this.http.get<Invoice[]>(`api/invoices/by-client/${clientId}`);
  }*/

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
    //const enterpriseId = this.localStorageMethods.getIdEnterprise();
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

          console.log("Recibo:", receiptFromApi)
          // 6. Construir y retornar el objeto que el componente espera.
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
    const receipt = this.mockReceiptsDB.find(r => r.id === id);
    if (!receipt) {
      return of(undefined);
    }

    // Usamos getPaymentMethods para tener la información necesaria para generar el asiento
    return this.getPaymentMethods().pipe(
      map(paymentMethods => {
        // Generamos el asiento dinámicamente usando la lógica correcta
        const generatedEntry = this._generateAccountingEntry(receipt, paymentMethods);

        const client = this.mockClientsDB.find(c => c.id === receipt.thirdPartyId);
        const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);

        const detailsView = receipt.details?.map(detail => {
          const invoice = this.mockInvoicesDB.find(inv => inv.id === detail.invoiceId);
          return { ...detail, invoiceCode: invoice ? invoice.factCode : 'N/A' };
        }) ?? [];

        const receiptDetailsView: ReceiptDetailsView = {
          clientName: client ? client.name : 'Desconocido',
          paymentMethodName: paymentMethod ? paymentMethod.name : 'No especificado',
          isDirectIncome: !receipt.details || receipt.details.length === 0,
          details: detailsView,
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          status: receipt.status,
          issueDate: receipt.issueDate,
          totalAmount: receipt.totalAmount,
          observations: receipt.observations,
          paymentMethodId: receipt.paymentMethodId,
          // Asignamos el asiento recién generado
          accountingEntry: generatedEntry
        };

        return receiptDetailsView;
      })
    );
  }

  /*createReceipt(receipt: Receipt): Observable<Receipt> {
    // Usamos switchMap para encadenar observables: primero necesitamos los métodos de pago para poder generar el asiento.
    return this.getPaymentMethods().pipe(
      switchMap(paymentMethods => {
        const generatedEntry = this._generateAccountingEntry(receipt, paymentMethods);

        const newId = this.mockReceiptsDB.length > 0
          ? Math.max(...this.mockReceiptsDB.map(r => r.id!).filter(Number.isFinite)) + 1
          : 1;

        const newCompleteReceipt: Receipt = {
          ...receipt,
          id: newId,
          receiptCode: `RC-1-${10000 + newId - 1}`, // Simula un consecutivo
          status: 'Activo',
          accountingEntry: generatedEntry // Adjuntamos el asiento generado
        };

        this.mockReceiptsDB.unshift(newCompleteReceipt);
        console.log("Recibo Creado con Asiento Contable Simulado:", newCompleteReceipt);
        
        // Retornamos el recibo completo como un observable
        return of(newCompleteReceipt);
      }),
    );
  }*/

  createReceipt(receiptData: ReceiptCreateRequest): Observable<ReceiptResponse> {
    // La URL de la API de pagos/recibos
    //const apiUrl = `${environment.API_URL}/api/payments`;
    
    return this.http.post<ReceiptResponse>(`${this.apiUrl}/`, receiptData);
}

  // --> NUEVO: Método privado que contiene la lógica para generar el asiento contable.
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