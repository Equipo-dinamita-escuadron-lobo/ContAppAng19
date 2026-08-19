import { VendorReport, VendorReportTransaction } from '../../Models/VendorReport';
import { VendorReportComponent } from './vendor-report.component';

describe('VendorReportComponent document status filter', () => {
  function transaction(
    documentStatus: string,
    reference: string,
    date = new Date(2026, 7, 10),
  ): VendorReportTransaction {
    return {
      date,
      reference,
      type: 'Bill',
      description: reference,
      debits: 0,
      credits: 100,
      balance: 100,
      documentStatus,
      voided: documentStatus === 'VOIDED',
    };
  }

  function componentWith(transactions: VendorReportTransaction[]): VendorReportComponent {
    const component = Object.create(VendorReportComponent.prototype) as VendorReportComponent;
    component.vendorReport = {
      vendor: { id: 4, name: 'Libardo Pantoja' },
      dateRange: { startDate: new Date(2026, 7, 1), endDate: new Date(2026, 7, 31) },
      transactions,
      periodTotals: {
        openingBalance: 0,
        periodPayments: 0,
        totalDebits: 0,
        totalCredits: 0,
        writeOffTotal: 0,
        netBalance: 0,
      },
      totalDue: 0,
      agingReport: {
        prePaid: 0,
        current: 0,
        days0to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91Plus: 0,
        total: 0,
      },
    } satisfies VendorReport;
    component.visibleTransactions = [];
    return component;
  }

  const rows = [
    transaction('POSTED', 'FC-POSTED'),
    transaction('VOIDED', 'FC-VOIDED'),
    transaction('DRAFT', 'FC-DRAFT'),
  ];

  it('shows every row when no status is selected', () => {
    const component = componentWith(rows);

    component.applyDocumentStatusFilter('');

    expect(component.visibleTransactions).toEqual(rows);
    expect(component.visibleTransactions).not.toBe(rows);
  });

  it('shows only POSTED documents for Contabilizado', () => {
    const component = componentWith(rows);

    component.applyDocumentStatusFilter('POSTED');

    expect(component.visibleTransactions.map((row) => row.reference)).toEqual(['FC-POSTED']);
  });

  it('shows only VOIDED documents for Anulado', () => {
    const component = componentWith(rows);

    component.applyDocumentStatusFilter('VOIDED');

    expect(component.visibleTransactions.map((row) => row.reference)).toEqual(['FC-VOIDED']);
  });

  it('supports DRAFT when that canonical state is present in the report', () => {
    const component = componentWith(rows);

    component.applyDocumentStatusFilter('DRAFT');

    expect(component.visibleTransactions.map((row) => row.reference)).toEqual(['FC-DRAFT']);
  });

  it('restores the complete source collection when the status is cleared', () => {
    const component = componentWith(rows);
    component.applyDocumentStatusFilter('VOIDED');

    component.applyDocumentStatusFilter(null);

    expect(component.visibleTransactions).toEqual(rows);
    expect(component.vendorReport?.transactions).toEqual(rows);
  });

  it('combines status with the rows already constrained by date and invoice filters', () => {
    const dateAndInvoiceRows = rows.filter(
      (row) => row.date >= new Date(2026, 7, 1)
        && row.date <= new Date(2026, 7, 31)
        && row.reference === 'FC-VOIDED',
    );
    const component = componentWith(dateAndInvoiceRows);

    component.applyDocumentStatusFilter('VOIDED');

    expect(component.visibleTransactions.map((row) => row.reference)).toEqual(['FC-VOIDED']);
  });

  it('returns an empty collection for a status that is not present', () => {
    const component = componentWith(rows);

    component.applyDocumentStatusFilter('NOT_A_STATUS');

    expect(component.visibleTransactions).toEqual([]);
  });

  it('identifies a voided invoice with text and not only color', () => {
    const component = componentWith(rows);

    expect(component.getTransactionTypeTag('Bill', true)).toEqual({
      severity: 'danger',
      text: 'Factura (Anulada)',
    });
  });
});
