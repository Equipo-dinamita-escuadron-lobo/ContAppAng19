import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleInvoiceCreationComponent } from './sale-invoice-creation.component';

describe('SaleInvoiceCreationComponent', () => {
  let component: SaleInvoiceCreationComponent;
  let fixture: ComponentFixture<SaleInvoiceCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleInvoiceCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleInvoiceCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
