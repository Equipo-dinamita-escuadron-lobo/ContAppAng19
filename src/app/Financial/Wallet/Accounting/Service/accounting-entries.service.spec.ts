import { TestBed } from '@angular/core/testing';

import { AccountingEntriesService } from './accounting-entries.service';

describe('AccountingEntriesService', () => {
  let service: AccountingEntriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountingEntriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
