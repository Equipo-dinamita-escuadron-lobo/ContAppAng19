import { VendorReportComponent } from './vendor-report.component';

describe('VendorReportComponent document status labels', () => {
  it('identifies a voided invoice with text and not only color', () => {
    const component = Object.create(VendorReportComponent.prototype) as VendorReportComponent;

    expect(component.getTransactionTypeTag('Bill', true)).toEqual({
      severity: 'danger',
      text: 'Factura (Anulada)',
    });
  });

  it('restores all document states when the status filter is cleared', () => {
    const component = Object.create(VendorReportComponent.prototype) as VendorReportComponent;

    expect(component.documentActiveFilter('ACTIVE')).toBeTrue();
    expect(component.documentActiveFilter('VOIDED')).toBeFalse();
    expect(component.documentActiveFilter(null)).toBeUndefined();
    expect(component.documentActiveFilter('')).toBeUndefined();
  });
});
