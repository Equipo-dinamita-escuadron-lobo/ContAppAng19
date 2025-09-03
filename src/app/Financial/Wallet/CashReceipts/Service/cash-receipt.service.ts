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

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {
  // TODO: Reemplazar con la URL base de tu API
  private apiUrl = 'api/cash-receipts';

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
    { id: 101, name: 'Julian Ruano Majin', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 102, name: 'Maria Lopez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 103, name: 'Pedro Gomez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 104, name: 'Ana Fernandez', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 105, name: 'Julian Piamba', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } },
    { id: 106, name: 'Juliana Campo', accountsReceivableAccount: { id: 1, code: '130505', name: 'Clientes Nacionales' } }
  ];

  private mockInvoicesDB: Invoice[] = [
    { id: 1, code: 'FV-2-10000', dueDate: new Date('2025-06-20'), pendingBalance: 1200000 },
    { id: 2, code: 'FV-2-10001', dueDate: new Date('2025-07-15'), pendingBalance: 500000 },
    { id: 3, code: 'FV-2-10002', dueDate: new Date('2025-08-10'), pendingBalance: 750000 },
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

    // Llamamos al servicio real. Usamos una página grande para traer todos los métodos.
    return this.paymentMethodsService.findAll(enterpriseId, 0, 100).pipe(
      map(page => {
        this.paymentMethodsCache = page.content;
        console.log(this.paymentMethodsCache);
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

  getInvoicesByClient(clientId: number): Observable<Invoice[]> {
    let invoices: Invoice[] = [];
    if (clientId === 101) {
      invoices = [
        { id: 1, code: 'FV-2-10000', dueDate: new Date('2025-06-20'), pendingBalance: 1200000 },
        { id: 2, code: 'FV-2-10001', dueDate: new Date('2025-07-15'), pendingBalance: 500000 },
        { id: 3, code: 'FV-2-10002', dueDate: new Date('2025-08-10'), pendingBalance: 750000 },
      ];
    }

    return of(invoices);
    // TODO: Cuando conectes al backend:
    // return this.http.get<Invoice[]>(`api/invoices/by-client/${clientId}`);
  }

  // --- MÉTODOS PARA EL CRUD DE RECIBOS ---

  getAllReceipts(): Observable<ReceiptView[]> {
    const receiptViews: ReceiptView[] = this.mockReceiptsDB.map(receipt => {
      const client = this.mockClientsDB.find(c => c.id === receipt.thirdPartyId);
      return {
        id: receipt.id ?? 0,
        receiptCode: receipt.receiptCode ?? '',
        issueDate: receipt.issueDate ?? new Date(),
        thirdPartyId: receipt.thirdPartyId ?? 0,
        clientName: client ? client.name : 'Desconocido',
        status: (receipt.status === 'Activo' ? 'Activo' : 'Anulado'),
        totalAmount: receipt.totalAmount ?? 0
      };
    });
    return of(receiptViews).pipe(delay(500));
  }

  getReceiptById(id: number): Observable<ReceiptDetailsView | undefined> {
    const receipt = this.mockReceiptsDB.find(r => r.id === id);
    if (!receipt) {
      return of(undefined);
    }

    return this.getPaymentMethods().pipe(
      map(paymentMethods => {
        const client = this.mockClientsDB.find(c => c.id === receipt.thirdPartyId);
        const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);

        const detailsView = receipt.details?.map(detail => {
          const invoice = this.mockInvoicesDB.find(inv => inv.id === detail.invoiceId);
          return { ...detail, invoiceCode: invoice ? invoice.code : 'N/A' };
        }) ?? [];

        const receiptDetailsView: ReceiptDetailsView = {
          clientName: client ? client.name : 'Desconocido',
          paymentMethodName: paymentMethod ? paymentMethod.name : 'No especificado',
          isDirectIncome: !receipt.details || receipt.details.length === 0,
          details: detailsView,
          // Propiedades del recibo base
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          status: receipt.status,
          issueDate: receipt.issueDate,
          totalAmount: receipt.totalAmount,
          observations: receipt.observations,
          paymentMethodId: receipt.paymentMethodId,
          // La información clave que añadimos:
          accountingEntry: receipt.accountingEntry
        };

        return receiptDetailsView;
      })
    );
  }

  createReceipt(receipt: Receipt): Observable<Receipt> {
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
  }

  // --> NUEVO: Método privado que contiene la lógica para generar el asiento contable.
  private _generateAccountingEntry(receipt: Receipt, paymentMethods: PaymentMethod[]): AccountingEntryLine[] {
    const entry: AccountingEntryLine[] = [];
    const total = receipt.totalAmount || 0;
    const thirdParty = receipt.thirdPartyId || 0;

    // 1. LÍNEA DEL DÉBITO (La cuenta que recibe el dinero)
    const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);
    if (!paymentMethod || !paymentMethod.accountingAccount) {
      console.error("Método de pago o su cuenta contable no encontrados. No se puede generar el asiento.");
      return [];
    }
    entry.push({
      accountCode: paymentMethod.accountingAccount,
      accountName: paymentMethod.name || 'Cuenta de Banco/Caja',
      debit: total,
      credit: 0,
      thirdPartyId: thirdParty,
      description: `Recibo de caja - ${receipt.observations}`
    });

    // 2. LÍNEA DEL CRÉDITO (La contrapartida)
    const isDirectIncome = !receipt.details || receipt.details.length === 0;

    if (isDirectIncome) {
      // Caso 1: Es un ingreso directo (no cruza con facturas).
      const auxAccountCode = receipt.auxAccount?.toString() || '4XXXXX'; // Usar un default si no viene
      entry.push({
        accountCode: auxAccountCode,
        accountName: 'Ingresos Varios', // En un sistema real, se buscaría el nombre de esta cuenta
        debit: 0,
        credit: total,
        thirdPartyId: thirdParty,
        description: `Ingreso directo - ${receipt.observations}`
      });
    } else {
      // Caso 2: Es un abono a deuda (cruza con facturas).
      const client = this.mockClientsDB.find(c => c.id === thirdParty);
      if (!client) {
        console.error("Cliente no encontrado para generar asiento de cartera.");
        return []; // No continuar si no podemos encontrar la cuenta del cliente
      }
      entry.push({
        accountCode: client.accountsReceivableAccount.code,
        accountName: client.accountsReceivableAccount.name,
        debit: 0,
        credit: total,
        thirdPartyId: thirdParty,
        description: `Abono a cartera de facturas`
      });
      

    }
    return entry;
  }
}
