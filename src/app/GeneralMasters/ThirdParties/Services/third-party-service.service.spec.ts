import { TestBed } from '@angular/core/testing';

import { ThirdPartyServiceService } from './third-party-service.service';

describe('ThirdPartyServiceService', () => {
  let service: ThirdPartyServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThirdPartyServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
