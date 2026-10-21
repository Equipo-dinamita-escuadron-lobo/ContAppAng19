import { TestBed } from '@angular/core/testing';

import { PortfolioWriteOffService } from './portfolio-write-off.service';

describe('PortfolioWriteOffService', () => {
  let service: PortfolioWriteOffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortfolioWriteOffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
