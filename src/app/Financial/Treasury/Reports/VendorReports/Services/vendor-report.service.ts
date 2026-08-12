import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { TreasuryApiService } from '../../../Shared/treasury-api.service';
import { VendorListFilter, VendorReport, VendorReportSummary } from '../Models/VendorReport';

@Injectable({ providedIn: 'root' })
export class VendorReportService {
  constructor(private readonly api: TreasuryApiService, private readonly storage: LocalStorageMethods) {}
  private enterpriseId() { const id = this.storage.getIdEnterprise(); if (!id) throw new Error('No hay una empresa activa'); return id; }

  getVendorSummaries(filter?: VendorListFilter): Observable<VendorReportSummary[]> {
    return this.api.pending(this.enterpriseId()).pipe(switchMap(payables => {
      const supplierIds = [...new Set(payables.map(item => item.supplierId))];
      return supplierIds.length ? forkJoin(supplierIds.map(id => this.api.statement(this.enterpriseId(), id))) : of([]);
    }), map(statements => (statements as any[]).map(statement => ({
      id: statement.supplierId, name: `Proveedor ${statement.supplierId}`,
      totalDebits: statement.paid, totalCredits: statement.invoiced, currentBalance: statement.pending,
      lastTransactionDate: new Date(Math.max(...statement.invoices.map((invoice: any) => new Date(invoice.issueDate).getTime()))),
      transactionCount: statement.invoices.length + statement.vouchers.length,
    })).filter(item => !filter?.searchTerm || item.name.toLowerCase().includes(filter.searchTerm.toLowerCase()))
      .filter(item => filter?.balanceFrom == null || item.currentBalance >= filter.balanceFrom)
      .filter(item => filter?.balanceTo == null || item.currentBalance <= filter.balanceTo)
      .filter(item => filter?.status !== 'with_balance' || item.currentBalance > 0)
      .filter(item => filter?.status !== 'no_balance' || item.currentBalance === 0)));
  }

  getVendorReport(vendorId: number, startDate: Date, endDate: Date, invoice?: string, active?: boolean): Observable<VendorReport> {
    return this.api.statement(this.enterpriseId(), vendorId, startDate.toISOString().slice(0,10), endDate.toISOString().slice(0,10), invoice, active).pipe(map(statement => {
      const bills = statement.invoices.map(invoice => ({ date: new Date(invoice.issueDate), dueDate: new Date(invoice.dueDate),
        reference: invoice.reference, documentNumber: invoice.reference, type: 'Bill' as const, description: 'Factura de compra',
        debits: 0, credits: invoice.originalAmount, balance: invoice.pendingAmount }));
      const payments = statement.vouchers.flatMap(voucher => voucher.details.filter(detail => detail.supplierId === vendorId).map(detail => ({
        date: new Date(voucher.issueDate), reference: detail.invoiceReference, expenseReceiptNumber: voucher.voucherNumber,
        type: 'Payment' as const, description: voucher.observations ?? '', debits: detail.amountPaid, credits: 0,
        balance: detail.remainingBalance,
      })));
      const transactions = [...bills, ...payments].filter(row => row.date >= startDate && row.date <= endDate)
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      return { vendor: { id: vendorId, name: `Proveedor ${vendorId}` }, dateRange: { startDate, endDate }, transactions,
        periodTotals: { totalDebits: payments.reduce((s, p) => s + p.debits, 0), totalCredits: bills.reduce((s, b) => s + b.credits, 0), netBalance: statement.pending },
        totalDue: statement.pending, agingReport: { prePaid: 0, current: statement.pending, days0to30: 0, days31to60: 0, days61to90: 0, days91Plus: 0, total: statement.pending } };
    }));
  }

  exportToPdf(vendorId: number, startDate: Date, endDate: Date) { return this.export(vendorId, startDate, endDate); }
  exportToExcel(vendorId: number, startDate: Date, endDate: Date) { return this.export(vendorId, startDate, endDate); }
  private export(vendorId: number, startDate: Date, endDate: Date): Observable<Blob> {
    return this.getVendorReport(vendorId, startDate, endDate).pipe(map(report => new Blob([
      ['Fecha,Documento,Tipo,Débitos,Créditos,Saldo', ...report.transactions.map(row =>
        [row.date.toISOString().slice(0, 10), row.reference, row.type, row.debits, row.credits, row.balance].join(','))].join('\n')
    ], { type: 'text/csv;charset=utf-8' })));
  }
}
