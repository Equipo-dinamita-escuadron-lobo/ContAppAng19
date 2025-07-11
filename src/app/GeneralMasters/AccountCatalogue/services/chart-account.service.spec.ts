import { TestBed } from '@angular/core/testing';

import { ChartAccountService } from './chart-account.service';

describe('ChartAccountService', () => {
  let service: ChartAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
