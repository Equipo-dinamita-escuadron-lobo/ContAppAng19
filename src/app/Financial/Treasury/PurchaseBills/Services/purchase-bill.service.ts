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

  // Generar siguiente número de factura
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

    // Mock data para desarrollo - Datos más completos
    const mockBills: PurchaseBillResponse[] = [
      // Facturas Contabilizadas (POSTED) - Últimos 6 meses
      {
        id: 1,
        billId: 'BILL-2025-0001',
        dateOpened: '2025-11-05',
        supplierId: 1,
        subtotal: 2500000,
        taxes: 475000,
        total: 2975000,
        notes: 'Suministros de oficina - Noviembre',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-11-05T09:00:00Z',
        updatedAt: '2025-11-05T09:00:00Z'
      },
      {
        id: 2,
        billId: 'BILL-2025-0002',
        dateOpened: '2025-11-01',
        supplierId: 2,
        subtotal: 1800000,
        taxes: 342000,
        total: 2142000,
        notes: 'Servicios de mantenimiento mensual',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-11-01T14:30:00Z',
        updatedAt: '2025-11-01T14:30:00Z'
      },
      {
        id: 3,
        billId: 'BILL-2025-0003',
        dateOpened: '2025-10-28',
        supplierId: 3,
        subtotal: 3200000,
        taxes: 608000,
        total: 3808000,
        notes: 'Equipos de cómputo',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-10-28T11:15:00Z',
        updatedAt: '2025-10-28T11:15:00Z'
      },
      {
        id: 4,
        billId: 'BILL-2025-0004',
        dateOpened: '2025-10-20',
        supplierId: 4,
        subtotal: 950000,
        taxes: 180500,
        total: 1130500,
        notes: 'Servicios de consultoría',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-10-20T16:45:00Z',
        updatedAt: '2025-10-20T16:45:00Z'
      },
      {
        id: 5,
        billId: 'BILL-2025-0005',
        dateOpened: '2025-10-15',
        supplierId: 5,
        subtotal: 1500000,
        taxes: 285000,
        total: 1785000,
        notes: 'Material de construcción',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-10-15T10:20:00Z',
        updatedAt: '2025-10-15T10:20:00Z'
      },
      {
        id: 6,
        billId: 'BILL-2025-0006',
        dateOpened: '2025-10-05',
        supplierId: 1,
        subtotal: 2200000,
        taxes: 418000,
        total: 2618000,
        notes: 'Suministros de limpieza',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-10-05T13:00:00Z',
        updatedAt: '2025-10-05T13:00:00Z'
      },
      {
        id: 7,
        billId: 'BILL-2025-0007',
        dateOpened: '2025-09-25',
        supplierId: 6,
        subtotal: 4500000,
        taxes: 855000,
        total: 5355000,
        notes: 'Equipos industriales',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-09-25T09:30:00Z',
        updatedAt: '2025-09-25T09:30:00Z'
      },
      {
        id: 8,
        billId: 'BILL-2025-0008',
        dateOpened: '2025-09-15',
        supplierId: 2,
        subtotal: 1100000,
        taxes: 209000,
        total: 1309000,
        notes: 'Servicios técnicos',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-09-15T15:00:00Z',
        updatedAt: '2025-09-15T15:00:00Z'
      },
      {
        id: 9,
        billId: 'BILL-2025-0009',
        dateOpened: '2025-08-30',
        supplierId: 3,
        subtotal: 2800000,
        taxes: 532000,
        total: 3332000,
        notes: 'Mobiliario de oficina',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-08-30T11:45:00Z',
        updatedAt: '2025-08-30T11:45:00Z'
      },
      {
        id: 10,
        billId: 'BILL-2025-0010',
        dateOpened: '2025-08-15',
        supplierId: 4,
        subtotal: 1650000,
        taxes: 313500,
        total: 1963500,
        notes: 'Asesoría legal',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-08-15T14:20:00Z',
        updatedAt: '2025-08-15T14:20:00Z'
      },
      {
        id: 11,
        billId: 'BILL-2025-0011',
        dateOpened: '2025-07-28',
        supplierId: 5,
        subtotal: 3100000,
        taxes: 589000,
        total: 3689000,
        notes: 'Herramientas industriales',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-07-28T10:00:00Z',
        updatedAt: '2025-07-28T10:00:00Z'
      },
      {
        id: 12,
        billId: 'BILL-2025-0012',
        dateOpened: '2025-06-20',
        supplierId: 1,
        subtotal: 1900000,
        taxes: 361000,
        total: 2261000,
        notes: 'Papelería corporativa',
        status: 'POSTED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-06-20T12:30:00Z',
        updatedAt: '2025-06-20T12:30:00Z'
      },

      // Facturas Pagadas (PAID)
      {
        id: 13,
        billId: 'BILL-2025-0013',
        dateOpened: '2025-06-10',
        supplierId: 2,
        subtotal: 2400000,
        taxes: 456000,
        total: 2856000,
        notes: 'Servicios de internet - Semestre',
        status: 'PAID',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-06-10T09:00:00Z',
        updatedAt: '2025-06-15T16:00:00Z'
      },
      {
        id: 14,
        billId: 'BILL-2025-0014',
        dateOpened: '2025-05-25',
        supplierId: 6,
        subtotal: 5200000,
        taxes: 988000,
        total: 6188000,
        notes: 'Maquinaria pesada',
        status: 'PAID',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-05-25T11:00:00Z',
        updatedAt: '2025-05-30T14:00:00Z'
      },
      {
        id: 15,
        billId: 'BILL-2025-0015',
        dateOpened: '2025-05-15',
        supplierId: 3,
        subtotal: 1750000,
        taxes: 332500,
        total: 2082500,
        notes: 'Materiales eléctricos',
        status: 'PAID',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-05-15T13:30:00Z',
        updatedAt: '2025-05-20T10:00:00Z'
      },

      // Facturas en Borrador (DRAFT)
      {
        id: 16,
        billId: 'BILL-2025-0016',
        dateOpened: '2025-11-06',
        supplierId: 4,
        subtotal: 850000,
        taxes: 161500,
        total: 1011500,
        notes: 'Servicios contables - Pendiente de revisar',
        status: 'DRAFT',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-11-06T08:00:00Z',
        updatedAt: '2025-11-06T08:00:00Z'
      },
      {
        id: 17,
        billId: 'BILL-2025-0017',
        dateOpened: '2025-11-05',
        supplierId: 5,
        subtotal: 1200000,
        taxes: 228000,
        total: 1428000,
        notes: 'Compra de inventario - Borrador',
        status: 'DRAFT',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-11-05T15:00:00Z',
        updatedAt: '2025-11-05T15:00:00Z'
      },
      {
        id: 18,
        billId: 'BILL-2025-0018',
        dateOpened: '2025-11-04',
        supplierId: 1,
        subtotal: 650000,
        taxes: 123500,
        total: 773500,
        notes: 'Catering evento corporativo',
        status: 'DRAFT',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-11-04T10:30:00Z',
        updatedAt: '2025-11-04T10:30:00Z'
      },

      // Facturas Canceladas (CANCELLED)
      {
        id: 19,
        billId: 'BILL-2025-0019',
        dateOpened: '2025-10-10',
        supplierId: 2,
        subtotal: 980000,
        taxes: 186200,
        total: 1166200,
        notes: 'Cancelada por duplicidad',
        status: 'CANCELLED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-10-10T12:00:00Z',
        updatedAt: '2025-10-12T09:00:00Z'
      },
      {
        id: 20,
        billId: 'BILL-2025-0020',
        dateOpened: '2025-09-05',
        supplierId: 6,
        subtotal: 1550000,
        taxes: 294500,
        total: 1844500,
        notes: 'Cancelada por error en facturación',
        status: 'CANCELLED',
        lineItems: [],
        enterpriseId: 'test-enterprise',
        createdAt: '2025-09-05T16:00:00Z',
        updatedAt: '2025-09-07T11:00:00Z'
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
