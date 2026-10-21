import { TestBed } from '@angular/core/testing';

import { PortfolioReportsService } from './portfolio-reports.service';

describe('PortfolioReportsService', () => {
  let service: PortfolioReportsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioReportsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
