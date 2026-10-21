import { TestBed } from '@angular/core/testing';

import { CashReceiptService } from './cash-receipt.service';

describe('CashReceiptService', () => {
  let service: CashReceiptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CashReceiptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
