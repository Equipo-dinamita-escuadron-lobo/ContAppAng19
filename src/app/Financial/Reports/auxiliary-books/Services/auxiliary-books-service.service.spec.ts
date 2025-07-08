import { TestBed } from '@angular/core/testing';

import { AuxiliaryBooksServiceService } from './auxiliary-books-service.service';

describe('AuxiliaryBooksServiceService', () => {
  let service: AuxiliaryBooksServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuxiliaryBooksServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
