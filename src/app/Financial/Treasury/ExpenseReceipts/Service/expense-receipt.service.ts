import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Supplier, DropdownOption, PurchaseInvoice, ExpenseReceiptView } from '../Model/Models';
import { ExpenseReceipt } from '../Model/ExpenseReceipt';
import { ExpenseReceiptDetailsView } from '../Model/ExpenseReceiptView';
import { PaymentMethod } from '../../../../GeneralMasters/PaymentMethods/models/PaymentMethods';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { AccountingEntryLine } from '../Model/AccountingEntryLine';
import { environment } from '../../../../../environments/environment';
import { ExpenseReceiptResponse } from '../Model/ExpenseReceiptResponse';
import { ExpenseReceiptCreateRequest } from '../Model/ExpenseReceiptCreateRequest';
import { VoidExpenseReceiptRequest } from '../Model/VoidExpenseReceiptRequest';

@Injectable({
  providedIn: 'root'
})
export class ExpenseReceiptService {
  private apiUrl = environment.API_URL + 'expense-payments';

  private paymentMethodsCache: PaymentMethod[] = [];

  private mockSuppliersDB: Supplier[] = [
    { id: 1, name: 'Proveedor ABC S.A.S', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 2, name: 'Suministros XYZ Ltda', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 3, name: 'Distribuciones DEF', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 4, name: 'Servicios GHI', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 5, name: 'Materiales JKL', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 6, name: 'Equipos MNO', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } }
  ];

  private mockPurchaseInvoicesDB: PurchaseInvoice[] = [
    { id: 1, factCode: 'FC-P-10000', expirationDate: new Date('2025-06-20'), pendingValue: 1200000 },
    { id: 2, factCode: 'FC-P-10001', expirationDate: new Date('2025-07-15'), pendingValue: 500000 },
    { id: 3, factCode: 'FC-P-10002', expirationDate: new Date('2025-08-10'), pendingValue: 750000 },
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
      { label: 'CE-1 - Comprobante de Egreso Caja', value: 'CE-1' },
      { label: 'CE-2 - Comprobante de Egreso Bancario', value: 'CE-2' },
    ];
    return of(data);
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/types`);
  }

  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    const data: DropdownOption[] = [
      { label: '511030 - Gastos de administración', value: 511030 },
      { label: '520505 - Gastos de ventas', value: 520505 },
      { label: '530505 - Gastos no operacionales', value: 530505 },
    ];
    return of(data);
    // TODO: Cuando conectes al backend:
    // return this.http.get<DropdownOption[]>(`${this.apiUrl}/auxiliary-accounts`);
  }

  getSuppliers(query: string): Observable<Supplier[]> {
    const filteredSuppliers = this.mockSuppliersDB.filter(supplier =>
      supplier.name.toLowerCase().includes(query.toLowerCase())
    );
    return of(filteredSuppliers);
  }

  public getSupplierById(id: number): Observable<Supplier | undefined> {
    const supplier = this.mockSuppliersDB.find(s => s.id === id);
    return of(supplier);
  }

  getInvoicesBySupplier(supplierId: number): Observable<PurchaseInvoice[]> {
    // 1. Hacemos la llamada HTTP a la nueva URL.
    return this.http.get<PurchaseInvoice[]>(`${this.apiUrl}/pending/supplier/${supplierId}`).pipe(
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


  // --- MÉTODOS PARA EL CRUD DE RECIBOS DE GASTOS ---
  getAllExpenseReceipts(): Observable<ExpenseReceiptView[]> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    if (!enterpriseId) {
      console.error("ID de empresa no encontrado. No se pueden cargar los recibos de gastos.");
      return of([]);
    }

    return this.http.get<ExpenseReceiptResponse[]>(`${this.apiUrl}/by-enterprise/${enterpriseId}`).pipe(
      map(apiReceipts => {

        if (!apiReceipts) {
          return [];
        }

        // 4. Transformar cada `ExpenseReceiptResponse` (de la API) en un `ExpenseReceiptView` (para la UI)
        return apiReceipts.map(receiptFromApi => {

          const supplier = this.mockSuppliersDB.find(s => s.id === receiptFromApi.thirdPartyId);

          return {
            id: receiptFromApi.id,
            receiptCode: receiptFromApi.receiptCode,
            issueDate: new Date(receiptFromApi.issueDate),
            thirdPartyId: receiptFromApi.thirdPartyId,
            supplierName: supplier ? supplier.name : `ID: ${receiptFromApi.thirdPartyId}`,
            status: receiptFromApi.status === 'FINALIZED' ? 'Activo' : 'Anulado',
            totalAmount: receiptFromApi.totalAmount
          };
        });
      })
    );
  }

  getExpenseReceiptById(id: number): Observable<ExpenseReceiptDetailsView | undefined> {
    return this.http.get<ExpenseReceiptResponse>(`${this.apiUrl}/${id}`).pipe(
      switchMap(receiptFromApi => {

        // 1. Buscar el supplier y el método de pago en paralelo
        const supplier$ = this.getSupplierById(receiptFromApi.thirdPartyId);
        const paymentMethods$ = this.getPaymentMethods();

        return forkJoin([supplier$, paymentMethods$]).pipe(
          map(([supplier, paymentMethods]) => {

            const paymentMethod = paymentMethods.find(p => p.id === receiptFromApi.paymentMethodId);

            // 3. Determinar si es un gasto directo (sin facturas asociadas)
            const isDirectExpense = !receiptFromApi.details || receiptFromApi.details.length === 0;

            // 4. Construir el objeto `ExpenseReceiptDetailsView`
            const receiptDetailsView: ExpenseReceiptDetailsView = {
              id: receiptFromApi.id,
              receiptCode: receiptFromApi.receiptCode,
              issueDate: new Date(receiptFromApi.issueDate),
              thirdPartyId: receiptFromApi.thirdPartyId,
              supplierName: supplier ? supplier.name : `ID: ${receiptFromApi.thirdPartyId}`,
              paymentMethodName: paymentMethod ? paymentMethod.name : `ID: ${receiptFromApi.paymentMethodId}`,
              status: receiptFromApi.status === 'FINALIZED' ? 'Activo' : 'Anulado',
              totalAmount: receiptFromApi.totalAmount,
              observations: receiptFromApi.observations,
              isDirectExpense: isDirectExpense,
              details: receiptFromApi.details.map(detail => ({
                invoiceId: detail.invoiceId,
                amountPaid: detail.amountPaid,
                invoiceCode: detail.invoiceCode,
                accountingAccount: detail.accountingAccount
              })),
              // Generar el asiento contable
              accountingEntry: this._generateAccountingEntry({ 
                id: receiptFromApi.id,
                totalAmount: receiptFromApi.totalAmount,
                thirdPartyId: receiptFromApi.thirdPartyId,
                paymentMethodId: receiptFromApi.paymentMethodId,
                details: receiptFromApi.details?.map(d => ({ invoiceId: d.invoiceId, amountPaid: d.amountPaid }))
              }, paymentMethods)

            };

            return receiptDetailsView;
          })
        );
      })
    );
  }

  createExpenseReceipt(receiptData: ExpenseReceiptCreateRequest): Observable<ExpenseReceiptResponse> {
    return this.http.post<ExpenseReceiptResponse>(`${this.apiUrl}/`, receiptData);
  }

  voidExpenseReceipt(receiptId: number, reason: string): Observable<ExpenseReceiptResponse> {
    const requestBody: VoidExpenseReceiptRequest = { reason };
    return this.http.put<ExpenseReceiptResponse>(`${this.apiUrl}/${receiptId}/void`, requestBody);
}

  private _generateAccountingEntry(receipt: ExpenseReceipt, paymentMethods: PaymentMethod[]): AccountingEntryLine[] {
    const entry: AccountingEntryLine[] = [];
    const total = receipt.totalAmount || 0;
    const thirdPartyId = receipt.thirdPartyId || 0;
    const supplier = this.mockSuppliersDB.find(s => s.id === thirdPartyId);

    // LÍNEA DEL CRÉDITO (salida de dinero)
    const paymentMethod = paymentMethods.find(p => p.id === receipt.paymentMethodId);
    if (!paymentMethod || !paymentMethod.accountingAccount) {
      console.error("Método de pago o su cuenta contable no encontrados.");
      return [];
    }
    entry.push({
      accountCode: paymentMethod.accountingAccount,
      accountName: paymentMethod.name,
      thirdPartyId: 0, // Los métodos de pago normalmente no tienen tercero asociado
      debit: 0,
      credit: total,
      description: `Pago a proveedor - ${receipt.receiptCode || 'N/A'}`
    });

    // LÍNEAS DEL DÉBITO
    if (receipt.details && receipt.details.length > 0) {
      // Pago de facturas específicas - debitar cuentas por pagar
      receipt.details.forEach(detail => {
        if (supplier && supplier.accountsPayableAccount) {
          entry.push({
            accountCode: supplier.accountsPayableAccount.code,
            accountName: supplier.accountsPayableAccount.name,
            thirdPartyId: thirdPartyId,
            debit: detail.amountPaid,
            credit: 0,
            description: `Pago factura ${detail.invoiceId}`,
            associatedInvoice: {
              invoiceNumber: `FC-${detail.invoiceId}`,
              amountCredited: detail.amountPaid
            }
          });
        }
      });
    } else {
      // Gasto directo - debitar cuenta de gastos
      entry.push({
        accountCode: "511030", // Cuenta de gastos por defecto
        accountName: "Gastos de administración",
        thirdPartyId: thirdPartyId,
        debit: total,
        credit: 0,
        description: `Gasto directo - ${receipt.receiptCode || 'N/A'}`
      });
    }

    return entry;
  }
}
