import { TestBed } from '@angular/core/testing';

import { DocumentTypesServiceService } from './document-types-service.service';

describe('DocumentTypesServiceService', () => {
  let service: DocumentTypesServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentTypesServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
