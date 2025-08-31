import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, map, Observable, of } from 'rxjs';
import { Client, DropdownOption, Invoice, ReceiptView } from '../Model/Models';
import { Receipt } from '../Model/Receipt';
import { ReceiptDetailsView } from '../Model/ReceiptView';
import { PaymentMethod } from '../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';

@Injectable({
  providedIn: 'root'
})
export class CashReceiptService {

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
      paymentMethodId: 1 
    },
    { 
      id: 7, receiptCode: 'RC-1-10006', thirdPartyId: 102, status: 'Activo', issueDate: new Date('2025-05-30'),
      totalAmount: 95000, observations: 'Ingreso directo por concepto de servicios varios.',
      details: [], 
      paymentMethodId: 2,
      auxAccount: 11050502
    },
  ];

  // Base de datos simulada para los recibos.
  private mockReceiptsDBView: ReceiptView[] = [
    { id: 1, receiptCode: 'RC-1-10000', issueDate: new Date('2025-06-20'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 60000 },
    { id: 2, receiptCode: 'RC-1-10001', issueDate: new Date('2025-06-19'), thirdPartyId: 105, clientName: 'Julian Piamba', status: 'Activo', totalAmount: 120000 },
    { id: 3, receiptCode: 'RC-1-10002', issueDate: new Date('2025-06-17'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Anulado', totalAmount: 85000 },
    { id: 4, receiptCode: 'RC-1-10003', issueDate: new Date('2025-06-17'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Activo', totalAmount: 50000 },
    { id: 5, receiptCode: 'RC-1-10004', issueDate: new Date('2025-06-15'), thirdPartyId: 103, clientName: 'Juliana Campo', status: 'Anulado', totalAmount: 75000 },
    { id: 6, receiptCode: 'RC-1-10005', issueDate: new Date('2025-06-14'), thirdPartyId: 101, clientName: 'Julian Ruano Majin', status: 'Activo', totalAmount: 200000 },
    { id: 7, receiptCode: 'RC-1-10006', issueDate: new Date('2025-05-30'), thirdPartyId: 102, clientName: 'Maria Lopez', status: 'Activo', totalAmount: 95000 },
  ];

  // Base de datos simulada para los clientes, para poder buscar el nombre al crear un recibo.
  private mockClientsDB: Client[] = [
    { id: 101, name: 'Julian Ruano Majin' },
    { id: 102, name: 'Maria Lopez' },
    { id: 103, name: 'Pedro Gomez' },
    { id: 104, name: 'Ana Fernandez' },
    { id: 105, name: 'Julian Piamba' },
    { id: 106, name: 'Juliana Campo' }
  ];

  private mockInvoicesDB: Invoice[] = [
    { id: 1, code: 'FV-2-10000', dueDate: new Date('2025-06-20'), pendingBalance: 1200000 },
    { id: 2, code: 'FV-2-10001', dueDate: new Date('2025-07-15'), pendingBalance: 500000 },
    { id: 3, code: 'FV-2-10002', dueDate: new Date('2025-08-10'), pendingBalance: 750000 },
  ];

  // TODO: Reemplazar con la URL base de tu API
  private apiUrl = 'api/cash-receipts'; 

  constructor(private http: HttpClient, private paymentMethodsService: PaymentMethodsServiceService,
    private localStorageMethods: LocalStorageMethods) { }


  private getPaymentMethods(): Observable<PaymentMethod[]> {
    if (this.paymentMethodsCache.length > 0) {
      // Si ya tenemos los datos en caché, los devolvemos inmediatamente.
      return of(this.paymentMethodsCache);
    }
    
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("No se encontró ID de la empresa en LocalStorage.");
      return of([]); // Devolver un array vacío si no hay empresa.
    }

    // Llamamos al servicio real. Usamos una página grande para traer todos los métodos.
    // En un caso real con muchos métodos de pago, se necesitaría una estrategia diferente.
    return this.paymentMethodsService.findAll(enterpriseId, 0, 100).pipe(
      map(page => {
        this.paymentMethodsCache = page.content; // Guardamos en caché
        console.log(this.paymentMethodsCache);

        return this.paymentMethodsCache;
      })
    );
  }

  // --- MÉTODOS PARA DATOS MAESTROS Y RELACIONADOS ---

  getReceiptTypes(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: 'RC-1 - Recibo de Caja', value: 'RC-1' },
      { label: 'RC-2 - Recibo Bancario', value: 'RC-2' },
    ];
    // Simula una llamada HTTP
    return of(data).pipe(delay(200)); 
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/types`);
  }

  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
        { label: 'Cuenta Auxiliar 1', value: '11050501' },
        { label: 'Cuenta Auxiliar 2', value: '11050502' },
        { label: 'Cuenta Auxiliar 3', value: '11050503' },
    ];
    return of(data).pipe(delay(200));
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/auxiliary-accounts`);
  }

  getClients(query: string): Observable<Client[]> {
    const filteredClients = this.mockClientsDB.filter(client => 
        client.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredClients).pipe(delay(300));
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
    // Podrías añadir más `else if` para simular otros clientes
    
    return of(invoices).pipe(delay(500));
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
      return of(undefined); // Si no se encuentra el recibo, no continuamos.
    }

    // Usamos switchMap para encadenar observables: primero obtenemos los métodos de pago
    // y luego, con esa información, construimos el objeto de detalle.
    return this.getPaymentMethods().pipe(
      map(paymentMethods => {
        // Una vez que tenemos los métodos de pago, el resto de la lógica es similar.
        const client = this.mockClientsDB.find(c => c.id === receipt.thirdPartyId);
        
        // ANTES: usaba mockPaymentMethodsDB.find(...)
        // AHORA: usa la lista real obtenida del servicio.
        const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);

        const detailsView = receipt.details?.map(detail => {
          const invoice = this.mockInvoicesDB.find(inv => inv.id === detail.invoiceId);
          return {
            ...detail,
            invoiceCode: invoice ? invoice.code : 'N/A'
          };
        });

        const receiptDetailsView: ReceiptDetailsView = {
          id: receipt.id,
          receiptCode: receipt.receiptCode,
          status: receipt.status,
          issueDate: receipt.issueDate,
          totalAmount: receipt.totalAmount,
          observations: receipt.observations,
          clientName: client ? client.name : 'Desconocido',
          paymentMethodName: paymentMethod ? paymentMethod.name : 'No especificado',
          isDirectIncome: receipt.details?.length === 0,
          details: detailsView ?? [],
          paymentMethodId: receipt.paymentMethodId
        };

        return receiptDetailsView;
      })
    );
  }

  createReceipt(receipt: Receipt): Observable<Receipt> {
    const newId = this.mockReceiptsDB.length > 0
      ? Math.max(...this.mockReceiptsDB.map(r => r.id!).filter(Number.isFinite)) + 1
      : 1;

    // Creamos un objeto completo de tipo Receipt
    const newCompleteReceipt: Receipt = {
      ...receipt, // Copiamos todas las propiedades del recibo entrante
      id: newId,
      status: 'Activo' // Asignamos valores por defecto
    };

    // Añadimos el objeto completo a nuestra "base de datos"
    this.mockReceiptsDB.unshift(newCompleteReceipt);

    // Devolvemos el objeto completo con su nuevo ID
    return of(newCompleteReceipt).pipe(delay(1000));
  }
}
