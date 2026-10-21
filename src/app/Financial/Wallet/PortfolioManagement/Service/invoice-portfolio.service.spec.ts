import { TestBed } from '@angular/core/testing';

import { InvoicePortfolioService } from './invoice-portfolio.service';

describe('InvoicePortfolioService', () => {
  let service: InvoicePortfolioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoicePortfolioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
