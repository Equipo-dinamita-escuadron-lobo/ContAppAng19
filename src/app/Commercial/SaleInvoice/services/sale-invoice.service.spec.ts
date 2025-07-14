import { TestBed } from '@angular/core/testing';

import { SaleInvoiceService } from './sale-invoice.service';

describe('SaleInvoiceService', () => {
  let service: SaleInvoiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SaleInvoiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
