import { TestBed } from '@angular/core/testing';

import { ThirdConfigurationService } from './third-configuration.service';

describe('ThirdConfigurationService', () => {
  let service: ThirdConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThirdConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
