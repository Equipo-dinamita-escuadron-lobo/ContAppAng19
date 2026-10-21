import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethodsCreationComponent } from './payment-methods-creation.component';

describe('PaymentMethodsCreationComponent', () => {
  let component: PaymentMethodsCreationComponent;
  let fixture: ComponentFixture<PaymentMethodsCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodsCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMethodsCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});