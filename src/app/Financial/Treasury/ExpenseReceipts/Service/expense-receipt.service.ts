import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
import { educationalDescription, translatePaymentMethodName, voucherStatusLabel } from '../../Shared/treasury-status-labels';
import { buildThirdPartyNameMap, resolveSupplierName } from '../../Shared/treasury-third-party.integration';

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
    const enterpriseId = this.enterpriseId();
    return forkJoin({
      payables: this.api.pending(enterpriseId),
      thirds: this.thirds.getThirdParties(enterpriseId, 0, 1000).pipe(
        catchError(() => of({ content: [] } as any)),
      ),
    }).pipe(
      map(({ payables, thirds }) => {
        const thirdNames = buildThirdPartyNameMap(thirds?.content || []);
        const ids = [...new Set(payables.map((item) => item.supplierId))];
        return ids
          .map((id) => {
            const payable = payables.find((item) => item.supplierId === id)!;
            return {
              id,
              name: resolveSupplierName(thirdNames, id),
              accountsPayableAccount: {
                id: payable.payableAccountId,
                code: payable.payableAccountCode,
                name: payable.payableAccountCode,
              },
            };
          })
          .filter((supplier) => supplier.name.toLowerCase().includes(query.toLowerCase()));
      }),
    );
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
      payableAccountId: item.payableAccountId,
      payableAccountCode: item.payableAccountCode,
    }))));
  }

  getAllExpenseReceipts(): Observable<ExpenseReceiptView[]> {
    const enterpriseId = this.enterpriseId();
    return forkJoin({
      vouchers: this.api.vouchers(enterpriseId),
      thirds: this.thirds.getThirdParties(enterpriseId, 0, 1000).pipe(
        catchError(() => of({ content: [] } as any)),
      ),
    }).pipe(
      map(({ vouchers, thirds }) => {
        const thirdNames = new Map<number, string>(
          (thirds?.content || []).map((t: any) => {
            const name =
              (t.socialReason as string) ||
              [t.names, t.lastNames].filter(Boolean).join(' ') ||
              `Proveedor ${t.thId}`;
            return [Number(t.thId), String(name)] as [number, string];
          }),
        );

        return (vouchers.content || []).map((voucher) => {
          const supplierIds = [...new Set((voucher.details || []).map((d) => d.supplierId))];
          const thirdPartyId = supplierIds[0] ?? 0;
          const supplierName =
            supplierIds.length > 1
              ? `${supplierIds.length} proveedores`
              : thirdNames.get(thirdPartyId) || `Proveedor ${thirdPartyId || ''}`;

          return {
            id: voucher.id,
            receiptCode: voucher.voucherNumber,
            issueDate: new Date(voucher.issueDate),
            thirdPartyId,
            supplierName,
            status: voucherStatusLabel(voucher.status),
            statusKey: voucher.status,
            totalAmount: voucher.total,
          };
        });
      }),
    );
  }
  getExpenseReceiptById(id: number): Observable<ExpenseReceiptDetailsView> {
    const enterpriseId = this.enterpriseId();
    return forkJoin({
      voucher: this.api.voucher(id, enterpriseId),
      thirds: this.thirds.getThirdParties(enterpriseId, 0, 1000).pipe(catchError(() => of({ content: [] } as any))),
      methods: this.paymentMethods.findAll(this.enterpriseId(), 0, 100).pipe(catchError(() => of({ content: [] } as any))),
    }).pipe(
      map(({ voucher, thirds, methods }) => {
        const thirdNames = buildThirdPartyNameMap(thirds?.content || []);
        const supplierId = voucher.details[0]?.supplierId ?? 0;
        const method = (methods.content || []).find((item: any) => item.id === voucher.paymentMethodId);
        return {
          id: voucher.id,
          receiptCode: voucher.voucherNumber,
          issueDate: new Date(voucher.issueDate),
          thirdPartyId: supplierId,
          supplierName: resolveSupplierName(thirdNames, supplierId),
          paymentMethodName: translatePaymentMethodName(method?.name) || `Método ${voucher.paymentMethodId}`,
          status: voucherStatusLabel(voucher.status),
          statusKey: voucher.status,
          totalAmount: voucher.total,
          observations: educationalDescription(voucher.observations, ''),
          isDirectExpense: false,
          details: voucher.details.map((detail) => ({
            invoiceId: detail.invoiceId,
            amountPaid: detail.amountPaid,
            invoiceCode: detail.invoiceReference,
            accountingAccount: detail.payableAccountId,
          })),
          accountingEntry: undefined,
        };
      }),
    );
  }

  createExpenseReceipt(request: ExpenseReceiptCreateRequest): Observable<ExpenseReceiptResponse> {
    return this.api.createVoucher({
      enterpriseId: request.enterpriseId,
      issueDate: new Date().toISOString().slice(0, 10),
      paymentMethodId: request.paymentMethodId,
      bankAccountId: request.bankAccountId ?? undefined,
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
