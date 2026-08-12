import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { PaymentMethodsServiceService } from '../../../../GeneralMasters/PaymentMethods/services/payment-methods-service.service';
import { ChartAccountService } from '../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { TreasuryApiService } from '../../Shared/treasury-api.service';
import { DropdownOption, ExpenseReceiptView, PurchaseInvoice, Supplier } from '../Model/Models';
import { ExpenseReceiptDetailsView } from '../Model/ExpenseReceiptView';
import { ExpenseReceiptResponse } from '../Model/ExpenseReceiptResponse';
import { ExpenseReceiptCreateRequest } from '../Model/ExpenseReceiptCreateRequest';
import { AccountingEntryLine } from '../Model/AccountingEntryLine';
import { ThirdService } from '../../../../GeneralMasters/ThirdParties/Services/third.service';

@Injectable({ providedIn: 'root' })
export class ExpenseReceiptService {
  constructor(
    private readonly api: TreasuryApiService,
    private readonly paymentMethods: PaymentMethodsServiceService,
    private readonly accounts: ChartAccountService,
    private readonly thirds: ThirdService,
    private readonly storage: LocalStorageMethods,
  ) {}

  private enterpriseId(): string {
    const id = this.storage.getIdEnterprise();
    if (!id) throw new Error('No hay una empresa activa');
    return id;
  }

  getReceiptTypes(): Observable<DropdownOption[]> {
    return this.paymentMethods.findAll(this.enterpriseId(), 0, 100).pipe(
      map(page => page.content.map(method => ({ label: method.name, value: method.id })))
    );
  }

  getAuxiliaryAccounts(): Observable<DropdownOption[]> {
    return this.accounts.getListAuxiliaryAccounts(this.enterpriseId()).pipe(
      map(items => items.filter(item => item.status !== false).map(item => ({
        label: `${item.code} - ${item.description}`, value: item.id
      })))
    );
  }

  getSuppliers(query = ''): Observable<Supplier[]> {
    return forkJoin({ payables: this.api.pending(this.enterpriseId()), thirds: this.thirds.getThirdParties(this.enterpriseId(), 0, 1000) }).pipe(map(({ payables, thirds }) => {
      const ids = [...new Set(payables.map(item => item.supplierId))];
      return ids.map(id => { const third = thirds.content.find(item => item.thId === id); return ({ id, name: third?.socialReason || [third?.names, third?.lastNames].filter(Boolean).join(' ') || `Proveedor ${id}`, accountsPayableAccount: {
        id: payables.find(item => item.supplierId === id)!.payableAccountId,
        code: payables.find(item => item.supplierId === id)!.payableAccountCode,
        name: payables.find(item => item.supplierId === id)!.payableAccountCode,
      }}); }).filter(supplier => supplier.name.toLowerCase().includes(query.toLowerCase()));
    }));
  }

  getSupplierById(id: number): Observable<Supplier | undefined> {
    return this.getSuppliers().pipe(map(items => items.find(item => item.id === id)));
  }

  getInvoicesBySupplier(supplierId: number): Observable<PurchaseInvoice[]> {
    return this.api.pending(this.enterpriseId(), supplierId).pipe(map(items => items.map(item => ({
      id: item.id,
      factCode: item.reference,
      expirationDate: new Date(item.dueDate),
      pendingValue: item.availableAmount,
      amountToPay: item.availableAmount,
    }))));
  }

  getAllExpenseReceipts(): Observable<ExpenseReceiptView[]> {
    return this.api.vouchers(this.enterpriseId()).pipe(map(page => page.content.map(voucher => ({
      id: voucher.id,
      receiptCode: voucher.voucherNumber,
      issueDate: new Date(voucher.issueDate),
      thirdPartyId: voucher.details[0]?.supplierId ?? 0,
      supplierName: voucher.details.length > 1 ? `${new Set(voucher.details.map(d => d.supplierId)).size} proveedores` : `Proveedor ${voucher.details[0]?.supplierId ?? ''}`,
      status: voucher.status === 'VOIDED' ? 'Anulado' as const : 'Activo' as const,
      totalAmount: voucher.total,
    }))));
  }

  getExpenseReceiptById(id: number): Observable<ExpenseReceiptDetailsView> {
    return this.api.voucher(id, this.enterpriseId()).pipe(map(voucher => ({
      id: voucher.id,
      receiptCode: voucher.voucherNumber,
      issueDate: new Date(voucher.issueDate),
      thirdPartyId: voucher.details[0]?.supplierId ?? 0,
      supplierName: `Proveedor ${voucher.details[0]?.supplierId ?? ''}`,
      paymentMethodName: `Método ${voucher.paymentMethodId}`,
      status: voucher.status === 'VOIDED' ? 'Anulado' as const : 'Activo' as const,
      totalAmount: voucher.total,
      observations: voucher.observations ?? '',
      isDirectExpense: false,
      details: voucher.details.map(detail => ({
        invoiceId: detail.invoiceId,
        amountPaid: detail.amountPaid,
        invoiceCode: detail.invoiceReference,
        accountingAccount: detail.payableAccountId,
      })),
      accountingEntry: undefined,
    })));
  }

  createExpenseReceipt(request: ExpenseReceiptCreateRequest): Observable<ExpenseReceiptResponse> {
    return this.api.createVoucher({
      enterpriseId: request.enterpriseId,
      issueDate: new Date().toISOString().slice(0, 10),
      paymentMethodId: request.paymentMethodId,
      observations: request.observations,
      details: request.details.map(detail => ({ supplierId: request.thirdPartyId, invoiceId: detail.invoiceId, amount: detail.amountPaid })),
    }).pipe(map(voucher => ({
      id: voucher.id, receiptCode: voucher.voucherNumber,
      thirdPartyId: voucher.details[0]?.supplierId ?? request.thirdPartyId,
      paymentMethodId: voucher.paymentMethodId, status: voucher.status,
      issueDate: voucher.issueDate, totalAmount: voucher.total,
      observations: voucher.observations ?? '',
      details: voucher.details.map(detail => ({ invoiceId: detail.invoiceId, amountPaid: detail.amountPaid,
        invoiceCode: detail.invoiceReference, accountingAccount: detail.payableAccountId })),
    })));
  }

  voidExpenseReceipt(receiptId: number, reason: string): Observable<ExpenseReceiptResponse> {
    return this.api.voidVoucher(receiptId, this.enterpriseId(), reason) as unknown as Observable<ExpenseReceiptResponse>;
  }

  getAccountingEntry(receiptId: number): Observable<AccountingEntryLine[]> {
    return this.api.accountingEntry(receiptId).pipe(map(response => (response.data?.movements ?? []).map((movement: any) => ({
      accountCode: String(movement.account), accountName: `Cuenta ${movement.account}`,
      thirdPartyId: movement.thirdPartyId ?? 0, debit: Number(movement.debit ?? 0), credit: Number(movement.credit ?? 0),
      description: movement.description ?? response.data.description,
    }))));
  }
}
