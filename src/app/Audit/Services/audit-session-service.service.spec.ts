import { TestBed } from '@angular/core/testing';

import { AuditSessionServiceService } from './audit-session-service.service';

describe('AuditSessionServiceService', () => {
  let service: AuditSessionServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuditSessionServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
