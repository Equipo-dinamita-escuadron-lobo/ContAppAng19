import { of } from 'rxjs';
import { ePersonType } from '../../../../../GeneralMasters/ThirdParties/models/ePersonType';
import { VendorReportService } from './vendor-report.service';

describe('VendorReportService summaries', () => {
  function service() {
    const api = {
      statement: jasmine.createSpy('statement').and.returnValue(of({
        supplierId: 7,
        invoiced: 500,
        paid: 100,
        pending: 400,
        invoices: [{ issueDate: '2026-08-14' }],
        vouchers: [],
      })),
    };
    const thirds = {
      getThirdsByType: jasmine.createSpy('getThirdsByType').and.returnValue(of({
        content: [{
          thId: 7,
          entId: 'enterprise-a',
          typeId: {} as any,
          thirdTypes: [],
          personType: ePersonType.juridica,
          socialReason: 'PEPSI',
          idNumber: 7,
          state: true,
          address: 'addr',
          phoneNumber: '1',
          email: 'a@b.com',
        }],
      })),
      getThirdParties: jasmine.createSpy('getThirdParties'),
    };
    const storage = { getIdEnterprise: () => 'enterprise-a' };
    const value = new VendorReportService(api as any, thirds as any, storage as any);
    return { value, api, thirds };
  }

  it('loads summaries from proveedores by type', (done) => {
    const { value, thirds } = service();
    value.getVendorSummaries().subscribe((summaries) => {
      expect(thirds.getThirdsByType).toHaveBeenCalledWith('enterprise-a', 'Proveedor');
      expect(summaries.length).toBe(1);
      expect(summaries[0].name).toBe('PEPSI');
      done();
    });
  });

  it('passes supplier and date filters to statement API', (done) => {
    const { value, api } = service();
    const dateFrom = new Date(2026, 7, 1);
    const dateTo = new Date(2026, 7, 31);
    value.getVendorSummaries({ supplierId: 7, dateFrom, dateTo }).subscribe(() => {
      expect(api.statement).toHaveBeenCalledWith('enterprise-a', 7, '2026-08-01', '2026-08-31');
      done();
    });
  });
});
