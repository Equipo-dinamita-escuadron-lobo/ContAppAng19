import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { ThirdService } from '../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { TreasuryApiService } from '../../../Shared/treasury-api.service';
import { educationalDescription } from '../../../Shared/treasury-status-labels';
import { VendorListFilter, VendorReport, VendorReportSummary } from '../Models/VendorReport';

@Injectable({ providedIn: 'root' })
export class VendorReportService {
  constructor(
    private readonly api: TreasuryApiService,
    private readonly thirds: ThirdService,
    private readonly storage: LocalStorageMethods,
  ) {}

  private enterpriseId() {
    const id = this.storage.getIdEnterprise();
    if (!id) throw new Error('No hay una empresa activa');
    return id;
  }

  getVendorSummaries(filter?: VendorListFilter): Observable<VendorReportSummary[]> {
    const enterpriseId = this.enterpriseId();
    return forkJoin({
      payables: this.api.pending(enterpriseId),
      thirds: this.thirds.getThirdParties(enterpriseId, 0, 1000).pipe(
        catchError(() => of({ content: [] } as any)),
      ),
    }).pipe(
      switchMap(({ payables, thirds }) => {
        const thirdNames = new Map<number, string>(
          (thirds?.content || []).map((t: any) => {
            const name =
              (t.socialReason as string) ||
              [t.names, t.lastNames].filter(Boolean).join(' ') ||
              `Proveedor ${t.thId}`;
            return [Number(t.thId), String(name)] as [number, string];
          }),
        );
        const supplierIds = [...new Set((payables || []).map((item) => item.supplierId))];
        if (!supplierIds.length) return of([]);

        return forkJoin(
          supplierIds.map((id) => this.api.statement(enterpriseId, id)),
        ).pipe(
          map((statements) =>
            (statements as any[])
              .map((statement) => ({
                id: statement.supplierId,
                name: thirdNames.get(statement.supplierId) || `Proveedor ${statement.supplierId}`,
                totalDebits: statement.paid,
                totalCredits: statement.invoiced,
                currentBalance: statement.pending,
                lastTransactionDate: new Date(
                  Math.max(
                    ...(statement.invoices || []).map((invoice: any) =>
                      new Date(invoice.issueDate).getTime(),
                    ),
                    0,
                  ),
                ),
                transactionCount:
                  (statement.invoices?.length || 0) + (statement.vouchers?.length || 0),
              }))
              .filter(
                (item) =>
                  !filter?.searchTerm ||
                  item.name.toLowerCase().includes(filter.searchTerm.toLowerCase()),
              )
              .filter(
                (item) => filter?.balanceFrom == null || item.currentBalance >= filter.balanceFrom,
              )
              .filter(
                (item) => filter?.balanceTo == null || item.currentBalance <= filter.balanceTo,
              )
              .filter(
                (item) => filter?.status !== 'with_balance' || item.currentBalance > 0,
              )
              .filter(
                (item) => filter?.status !== 'no_balance' || item.currentBalance === 0,
              ),
          ),
        );
      }),
    );
  }

  getInvoiceOptions(vendorId: number): Observable<{ label: string; value: string }[]> {
    return this.api.pending(this.enterpriseId(), vendorId).pipe(
      map((items) =>
        (items || [])
          .map((p) => ({ label: `${p.reference} · ${this.formatMoney(p.availableAmount)}`, value: p.reference }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      ),
      catchError(() => of([])),
    );
  }

  getVendorReport(
    vendorId: number,
    startDate: Date,
    endDate: Date,
    invoice?: string,
    active?: boolean,
    vendorName?: string,
  ): Observable<VendorReport> {
    return this.api
      .statement(
        this.enterpriseId(),
        vendorId,
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10),
        invoice,
        active,
      )
      .pipe(
        map((statement) => {
          const bills = (statement.invoices || []).map((inv: any) => ({
            date: new Date(inv.issueDate),
            dueDate: new Date(inv.dueDate),
            reference: inv.reference,
            documentNumber: inv.reference,
            type: 'Bill' as const,
            description: 'Factura de compra',
            debits: 0,
            credits: Number(inv.originalAmount || 0),
            balance: Number(inv.pendingAmount || 0),
          }));

          const payments = (statement.vouchers || []).flatMap((voucher: any) =>
            (voucher.details || [])
              .filter((detail: any) => detail.supplierId === vendorId)
              .map((detail: any) => ({
                date: new Date(voucher.issueDate),
                reference: detail.invoiceReference,
                expenseReceiptNumber: voucher.voucherNumber,
                type: 'Payment' as const,
                description: educationalDescription(voucher.observations, 'Pago a proveedor'),
                debits: Number(detail.amountPaid || 0),
                credits: 0,
                balance: Number(detail.remainingBalance || 0),
              })),
          );

          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);

          const transactions = [...bills, ...payments]
            .filter((row) => row.date >= start && row.date <= end)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

          const totalDebits = payments.reduce((s, p) => s + p.debits, 0);
          const totalCredits = bills.reduce((s, b) => s + b.credits, 0);
          const pending = Number(statement.pending || 0);

          return {
            vendor: { id: vendorId, name: vendorName || `Proveedor ${vendorId}` },
            dateRange: { startDate, endDate },
            transactions,
            periodTotals: {
              totalDebits,
              totalCredits,
              netBalance: pending,
            },
            totalDue: pending,
            agingReport: {
              prePaid: 0,
              current: pending,
              days0to30: 0,
              days31to60: 0,
              days61to90: 0,
              days91Plus: 0,
              total: pending,
            },
          };
        }),
      );
  }

  buildPdf(report: VendorReport): Blob {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const fmt = (n: number) => this.formatMoney(n);
    const fmtDate = (d: Date) =>
      new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(d));

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Estado de cuenta por proveedor', 40, 36);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Proveedor: ${report.vendor.name}`, 40, 54);
    doc.text(
      `Período: ${fmtDate(report.dateRange.startDate)} — ${fmtDate(report.dateRange.endDate)}`,
      40,
      68,
    );
    doc.text(`Generado: ${fmtDate(new Date())}`, 40, 82);

    autoTable(doc, {
      startY: 96,
      theme: 'grid',
      head: [
        [
          'Fecha',
          'Vence',
          'Referencia',
          'Documento',
          'Comp. egreso',
          'Tipo',
          'Descripción',
          'Débitos',
          'Créditos',
          'Saldo',
        ],
      ],
      body: report.transactions.map((t) => [
        fmtDate(t.date),
        t.dueDate ? fmtDate(t.dueDate) : '-',
        t.reference || '-',
        t.documentNumber || '-',
        t.expenseReceiptNumber || '-',
        t.type === 'Bill' ? 'Factura' : 'Pago',
        t.description || '-',
        t.debits > 0 ? fmt(t.debits) : '-',
        t.credits > 0 ? fmt(t.credits) : '-',
        fmt(t.balance),
      ]),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [0, 86, 179], textColor: 255 },
      columnStyles: {
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
      },
    });

    const finalY = (doc as any).lastAutoTable?.finalY ?? 96;

    autoTable(doc, {
      startY: finalY + 16,
      theme: 'plain',
      body: [
        ['Total débitos (pagos)', fmt(report.periodTotals.totalDebits)],
        ['Total créditos (facturas)', fmt(report.periodTotals.totalCredits)],
        ['Saldo pendiente', fmt(report.totalDue)],
      ],
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    const agingY = ((doc as any).lastAutoTable?.finalY ?? finalY) + 16;
    autoTable(doc, {
      startY: agingY,
      theme: 'grid',
      head: [['Antigüedad', 'Monto']],
      body: [
        ['Corriente', fmt(report.agingReport.current)],
        ['0-30 días', fmt(report.agingReport.days0to30)],
        ['31-60 días', fmt(report.agingReport.days31to60)],
        ['61-90 días', fmt(report.agingReport.days61to90)],
        ['91+ días', fmt(report.agingReport.days91Plus)],
        ['Total', fmt(report.agingReport.total)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [100, 100, 100] },
      columnStyles: { 1: { halign: 'right' } },
    });

    return doc.output('blob');
  }

  buildExcel(report: VendorReport): Blob {
    const fmtDate = (d: Date) =>
      new Intl.DateTimeFormat('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(d));

    const wb = XLSX.utils.book_new();
    const ws: XLSX.WorkSheet = {};

    const headerInfo = [
      ['Estado de cuenta por proveedor'],
      ['Proveedor:', report.vendor.name],
      [
        'Período:',
        `${fmtDate(report.dateRange.startDate)} — ${fmtDate(report.dateRange.endDate)}`,
      ],
      ['Generado:', fmtDate(new Date())],
      [],
      ['Total débitos (pagos)', report.periodTotals.totalDebits],
      ['Total créditos (facturas)', report.periodTotals.totalCredits],
      ['Saldo pendiente', report.totalDue],
      [],
    ];

    XLSX.utils.sheet_add_aoa(ws, headerInfo, { origin: 'A1' });

    const tableHeaders = [
      [
        'Fecha',
        'Vence',
        'Referencia',
        'Documento',
        'Comp. egreso',
        'Tipo',
        'Descripción',
        'Débitos',
        'Créditos',
        'Saldo',
      ],
    ];

    const tableData = report.transactions.map((t) => [
      fmtDate(t.date),
      t.dueDate ? fmtDate(t.dueDate) : '',
      t.reference || '',
      t.documentNumber || '',
      t.expenseReceiptNumber || '',
      t.type === 'Bill' ? 'Factura' : 'Pago',
      t.description || '',
      t.debits || 0,
      t.credits || 0,
      t.balance || 0,
    ]);

    XLSX.utils.sheet_add_aoa(ws, tableHeaders, { origin: 'A10' });
    XLSX.utils.sheet_add_aoa(ws, tableData, { origin: 'A11' });

    const agingStart = 11 + tableData.length + 2;
    XLSX.utils.sheet_add_aoa(
      ws,
      [
        ['Antigüedad de saldos'],
        ['Concepto', 'Monto'],
        ['Corriente', report.agingReport.current],
        ['0-30 días', report.agingReport.days0to30],
        ['31-60 días', report.agingReport.days31to60],
        ['61-90 días', report.agingReport.days61to90],
        ['91+ días', report.agingReport.days91Plus],
        ['Total', report.agingReport.total],
      ],
      { origin: `A${agingStart}` },
    );

    ws['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 10 },
      { wch: 28 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Estado de cuenta');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  exportToPdf(report: VendorReport): Blob {
    return this.buildPdf(report);
  }

  exportToExcel(report: VendorReport): Blob {
    return this.buildExcel(report);
  }

  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }
}
