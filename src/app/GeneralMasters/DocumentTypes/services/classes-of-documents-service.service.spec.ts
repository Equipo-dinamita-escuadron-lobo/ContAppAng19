import { TestBed } from '@angular/core/testing';

import { ClassesOfDocumentsServiceService } from './classes-of-documents-service.service';

describe('ClassesOfDocumentsServiceService', () => {
  let service: ClassesOfDocumentsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClassesOfDocumentsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
