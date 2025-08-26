import { TestBed } from '@angular/core/testing';

import { NoCommercialTagService } from './no-commercial-tag.service';

describe('NoCommercialTagService', () => {
  let service: NoCommercialTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoCommercialTagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
