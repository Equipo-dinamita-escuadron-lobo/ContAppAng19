import { TestBed } from '@angular/core/testing';

import { ThirdPartyConfigurationServiceService } from './third-party-configuration-service.service';

describe('ThirdPartyConfigurationServiceService', () => {
  let service: ThirdPartyConfigurationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThirdPartyConfigurationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
