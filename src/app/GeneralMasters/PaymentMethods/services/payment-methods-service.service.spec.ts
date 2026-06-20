import { TestBed } from '@angular/core/testing';

import { PaymentMethodsServiceService } from './payment-methods-service.service';

describe('PaymentMethodsServiceService', () => {
  let service: PaymentMethodsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentMethodsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
