import { TestBed } from '@angular/core/testing';

import { KardexPepsService } from './kardex-peps.service';

describe('KardexPepsService', () => {
  let service: KardexPepsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KardexPepsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
