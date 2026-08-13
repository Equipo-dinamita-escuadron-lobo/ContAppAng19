import { of } from 'rxjs';
import { AgingReportService } from './aging-report.service';

describe('AgingReportService filter options', () => {
  it('labels accounts by PUC code and documents by supplier name', (done) => {
    const api = {
      pending: jasmine.createSpy('pending').and.returnValue(
        of([
          {
            supplierId: 7,
            reference: 'FC-100',
            payableAccountCode: '220501',
          },
        ]),
      ),
    };
    const accounts = {
      getListAuxiliaryAccounts: jasmine.createSpy('getListAuxiliaryAccounts').and.returnValue(
        of([{ id: 55, code: '220501', description: 'Proveedores nacionales', status: true }]),
      ),
    };
    const thirds = {
      getThirdParties: jasmine.createSpy('getThirdParties').and.returnValue(
        of({ content: [{ thId: 7, socialReason: 'Acme Ltda.' }] }),
      ),
    };
    const service = new AgingReportService(api as any, accounts as any, thirds as any);

    service.getFilterOptions('ent-1').subscribe((options) => {
      expect(options.accounts[0].label).toBe('220501 - Proveedores nacionales');
      expect(options.documents[0].label).toBe('FC-100 · Acme Ltda.');
      expect(options.suppliers[0].name).toBe('Acme Ltda.');
      done();
    });
  });
});

describe('AgingReportService report lines', () => {
  it('resolves account description using account code from aging API', (done) => {
    const api = {
      aging: jasmine.createSpy('aging').and.returnValue(
        of([
          {
            invoiceId: 1,
            supplierId: 7,
            reference: 'FC-100',
            accountCode: '220501',
            dueDate: '2026-08-01',
            daysOverdue: 5,
            current: 100,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days91Plus: 0,
          },
        ]),
      ),
    };
    const accounts = {
      getListAuxiliaryAccounts: jasmine.createSpy('getListAuxiliaryAccounts').and.returnValue(
        of([{ id: 55, code: '220501', description: 'Proveedores nacionales', status: true }]),
      ),
    };
    const thirds = {
      getThirdParties: jasmine.createSpy('getThirdParties').and.returnValue(of({ content: [] })),
    };
    const service = new AgingReportService(api as any, accounts as any, thirds as any);

    service.getAgingReport('ent-1', { cutoffDate: new Date('2026-08-13'), includeDocuments: true }).subscribe((report) => {
      expect(report.lines[0].accountDescription).toBe('220501 - Proveedores nacionales');
      done();
    });
  });
});
