import { Injectable } from '@angular/core';
import { Observable, map, of, throwError } from 'rxjs';
import { TreasuryApiService } from '../../Shared/treasury-api.service';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { ExpenseAccount, PurchaseBill, PurchaseBillCreateRequest, PurchaseBillListView } from '../Models/PurchaseBill';

interface Supplier { id: number; name: string; accountsPayableAccount: { id: number; code: string; name: string } }

@Injectable({ providedIn: 'root' })
export class PurchaseBillService {
  constructor(private readonly api: TreasuryApiService, private readonly accounts: ChartAccountService,
    private readonly storage: LocalStorageMethods) {}
  private enterpriseId() { const id = this.storage.getIdEnterprise(); if (!id) throw new Error('No hay una empresa activa'); return id; }

  getSuppliers(query = ''): Observable<Supplier[]> {
    return this.api.pending(this.enterpriseId()).pipe(map(items => [...new Set(items.map(item => item.supplierId))]
      .map(id => { const payable = items.find(item => item.supplierId === id)!; return { id, name: `Proveedor ${id}`,
        accountsPayableAccount: { id: payable.payableAccountId, code: payable.payableAccountCode, name: payable.payableAccountCode } }; })
      .filter(item => item.name.toLowerCase().includes(query.toLowerCase()))));
  }
  getSupplierById(id: number) { return this.getSuppliers().pipe(map(items => items.find(item => item.id === id))); }
  getExpenseAccounts(): Observable<ExpenseAccount[]> {
    return this.accounts.getListAuxiliaryAccounts(this.enterpriseId()).pipe(map(items => items.filter(item => item.status !== false)
      .map(item => ({ id: item.id!, code: item.code, name: item.description, fullName: `${item.code} - ${item.description}` }))));
  }
  getNextBillId(): Observable<string> { return of('Asignado por Facturación'); }
  getAllPurchaseBills(enterpriseId: string): Observable<PurchaseBillListView[]> {
    return this.api.pending(enterpriseId).pipe(map(items => items.map(item => ({ id: item.id, billId: item.reference,
      dateOpened: new Date(item.issueDate), supplierName: `Proveedor ${item.supplierId}`, total: item.originalAmount,
      paidAmount: item.paidAmount, pendingBalance: item.availableAmount, status: 'POSTED', statusDisplay: 'Pendiente de pago' }))));
  }
  getPurchaseBillById(id: number): Observable<PurchaseBill | undefined> {
    return this.api.pending(this.enterpriseId()).pipe(map(items => { const item = items.find(value => value.id === id); return item ? {
      id: item.id, billId: item.reference, dateOpened: new Date(item.issueDate), supplierId: item.supplierId,
      subtotal: item.originalAmount, total: item.originalAmount, paidAmount: item.paidAmount,
      pendingBalance: item.availableAmount, status: 'POSTED' as const, lineItems: [], enterpriseId: item.enterpriseId,
    } : undefined; }));
  }
  createPurchaseBill(billData: PurchaseBillCreateRequest): Observable<PurchaseBill> {
    return throwError(() => new Error('Las facturas de compra se crean en Facturación y se sincronizan automáticamente con Tesorería.'));
  }
  updatePurchaseBill(id: number, billData: Partial<PurchaseBillCreateRequest>): Observable<PurchaseBill> {
    return throwError(() => new Error('La obligación sincronizada no se edita desde Tesorería; solo puede modificarse su vencimiento operativo.'));
  }
  deletePurchaseBill(id: number): Observable<void> {
    return throwError(() => new Error('Las obligaciones sincronizadas no se eliminan desde Tesorería.'));
  }
}
