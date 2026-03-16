import { TestBed } from '@angular/core/testing';

import { FinancialStatementsService } from './financial-statements.service';

describe('FinancialStatementsService', () => {
  let service: FinancialStatementsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FinancialStatementsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

