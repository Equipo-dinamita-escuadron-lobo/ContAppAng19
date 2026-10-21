import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentMethodsEditComponent } from './payment-methods-edit.component';

describe('PaymentMethodsEditComponent', () => {
  let component: PaymentMethodsEditComponent;
  let fixture: ComponentFixture<PaymentMethodsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodsEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentMethodsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});