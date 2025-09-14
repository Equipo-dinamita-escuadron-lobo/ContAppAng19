import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  PurchaseBill,
  PurchaseBillCreateRequest,
  PurchaseBillResponse,
  PurchaseBillListView,
  ExpenseAccount
} from '../Models/PurchaseBill';

// Mock data para proveedores (reutilizando la estructura de ExpenseReceipts)
interface Supplier {
  id: number;
  name: string;
  accountsPayableAccount: {
    id: number;
    code: string;
    name: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseBillService {
  private apiUrl = environment.API_URL + 'purchase-bills';

  // Mock data para desarrollo
  private mockSuppliersDB: Supplier[] = [
    { id: 1, name: 'Proveedor ABC S.A.S', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 2, name: 'Suministros XYZ Ltda', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 3, name: 'Distribuciones DEF', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 4, name: 'Servicios GHI', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 5, name: 'Materiales JKL', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } },
    { id: 6, name: 'Equipos MNO', accountsPayableAccount: { id: 1, code: '220505', name: 'Proveedores Nacionales' } }
  ];

  private mockExpenseAccounts: ExpenseAccount[] = [
    { id: 1, code: '511030', name: 'Gastos de administración', fullName: '511030 - Gastos de administración' },
    { id: 2, code: '520505', name: 'Gastos de ventas', fullName: '520505 - Gastos de ventas' },
    { id: 3, code: '530505', name: 'Gastos no operacionales', fullName: '530505 - Gastos no operacionales' },
    { id: 4, code: '511505', name: 'Gastos de personal', fullName: '511505 - Gastos de personal' },
    { id: 5, code: '511010', name: 'Servicios públicos', fullName: '511010 - Servicios públicos' },
    { id: 6, code: '511020', name: 'Arrendamientos', fullName: '511020 - Arrendamientos' },
    { id: 7, code: '511040', name: 'Mantenimiento y reparaciones', fullName: '511040 - Mantenimiento y reparaciones' },
    { id: 8, code: '520510', name: 'Publicidad y propaganda', fullName: '520510 - Publicidad y propaganda' }
  ];

  constructor(private http: HttpClient) { }

  // Métodos para obtener datos de apoyo (suppliers y expense accounts)
  getSuppliers(query?: string): Observable<Supplier[]> {
    if (query) {
      const filtered = this.mockSuppliersDB.filter(supplier =>
        supplier.name.toLowerCase().includes(query.toLowerCase())
      );
      return of(filtered);
    }
    return of(this.mockSuppliersDB);
  }

  getSupplierById(id: number): Observable<Supplier | undefined> {
    const supplier = this.mockSuppliersDB.find(s => s.id === id);
    return of(supplier);
  }

  getExpenseAccounts(): Observable<ExpenseAccount[]> {
    return of(this.mockExpenseAccounts);
    // TODO: Cuando conectes al backend:
    // return this.http.get<ExpenseAccount[]>(`${environment.API_URL}chart-accounts/expense-accounts`);
  }

  // Generar siguiente Bill ID
  getNextBillId(): Observable<string> {
    // Mock: generar un ID basado en fecha
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-4);

    const billId = `BILL-${year}${month}${day}-${time}`;
    return of(billId);
    // TODO: Cuando conectes al backend:
    // return this.http.get<{nextBillId: string}>(`${this.apiUrl}/next-bill-id`).pipe(
    //   map(response => response.nextBillId)
    // );
  }

  // CRUD operations
  getAllPurchaseBills(enterpriseId: string): Observable<PurchaseBillListView[]> {
    // TODO: Implementar llamada real al backend
    // return this.http.get<PurchaseBillResponse[]>(`${this.apiUrl}/by-enterprise/${enterpriseId}`).pipe(
    //   map(bills => this.mapBillsToListView(bills))
    // );

    // Mock data para desarrollo
    const mockBills: PurchaseBillResponse[] = [
      {
        id: 1,
        billId: 'BILL-20250914-0001',
        dateOpened: '2025-09-14',
        supplierId: 1,
        subtotal: 1000000,
        taxes: 190000,
        total: 1190000,
        notes: 'Factura de prueba 1',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-09-14T10:00:00Z',
        updatedAt: '2025-09-14T10:00:00Z'
      },
      {
        id: 2,
        billId: 'BILL-20250914-0002',
        dateOpened: '2025-09-13',
        supplierId: 2,
        subtotal: 500000,
        taxes: 95000,
        total: 595000,
        notes: 'Factura de prueba 2',
        status: 'DRAFT',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-09-13T15:30:00Z',
        updatedAt: '2025-09-13T15:30:00Z'
      }
    ];

    return of(this.mapBillsToListView(mockBills));
  }

  getPurchaseBillById(id: number): Observable<PurchaseBill | undefined> {
    // TODO: Implementar llamada real al backend
    // return this.http.get<PurchaseBillResponse>(`${this.apiUrl}/${id}`).pipe(
    //   map(bill => this.mapResponseToBill(bill))
    // );

    // Mock data para desarrollo
    return of(undefined);
  }

  createPurchaseBill(billData: PurchaseBillCreateRequest): Observable<PurchaseBill> {
    console.log('Creating purchase bill:', billData);

    // TODO: Implementar llamada real al backend
    // return this.http.post<PurchaseBillResponse>(`${this.apiUrl}`, billData).pipe(
    //   map(response => this.mapResponseToBill(response))
    // );

    // Mock response para desarrollo
    const mockResponse: PurchaseBill = {
      id: Math.floor(Math.random() * 1000),
      billId: billData.billId,
      dateOpened: billData.dateOpened,
      supplierId: billData.supplierId,
      subtotal: billData.subtotal,
      taxes: billData.taxes,
      total: billData.total,
      notes: billData.notes,
      enterpriseId: billData.enterpriseId,
      status: 'DRAFT',
      // Convertir lineItems de CreateRequest a LineItem agregando lineTotal
      lineItems: billData.lineItems.map(item => ({
        ...item,
        lineTotal: item.quantity * item.unitPrice
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return of(mockResponse);
  }

  updatePurchaseBill(id: number, billData: Partial<PurchaseBillCreateRequest>): Observable<PurchaseBill> {
    // TODO: Implementar llamada real al backend
    // return this.http.put<PurchaseBillResponse>(`${this.apiUrl}/${id}`, billData).pipe(
    //   map(response => this.mapResponseToBill(response))
    // );

    return of({} as PurchaseBill);
  }

  deletePurchaseBill(id: number): Observable<void> {
    // TODO: Implementar llamada real al backend
    // return this.http.delete<void>(`${this.apiUrl}/${id}`);

    return of(void 0);
  }

  // Helper methods para mapear datos
  private mapBillsToListView(bills: PurchaseBillResponse[]): PurchaseBillListView[] {
    return bills.map(bill => {
      const supplier = this.mockSuppliersDB.find(s => s.id === bill.supplierId);

      return {
        id: bill.id,
        billId: bill.billId,
        dateOpened: new Date(bill.dateOpened),
        supplierName: supplier ? supplier.name : `ID: ${bill.supplierId}`,
        total: bill.total,
        status: bill.status,
        statusDisplay: this.getStatusDisplay(bill.status)
      };
    });
  }

  private mapResponseToBill(response: PurchaseBillResponse): PurchaseBill {
    return {
      id: response.id,
      billId: response.billId,
      dateOpened: new Date(response.dateOpened),
      supplierId: response.supplierId,
      subtotal: response.subtotal,
      taxes: response.taxes,
      total: response.total,
      notes: response.notes,
      status: response.status as any,
      lineItems: response.lineItems.map(item => ({
        id: item.id,
        billId: item.billId,
        date: new Date(item.date),
        description: item.description,
        expenseAccountId: item.expenseAccountId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal
      })),
      enterpriseId: response.enterpriseId,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt)
    };
  }

  private getStatusDisplay(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Borrador',
      'POSTED': 'Contabilizada',
      'PAID': 'Pagada',
      'CANCELLED': 'Cancelada'
    };
    return statusMap[status] || status;
  }
}
