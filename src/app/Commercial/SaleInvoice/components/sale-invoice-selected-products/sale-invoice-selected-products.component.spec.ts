import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaleInvoiceSelectedProductsComponent } from './sale-invoice-selected-products.component';

describe('SaleInvoiceSelectedProductsComponent', () => {
  let component: SaleInvoiceSelectedProductsComponent;
  let fixture: ComponentFixture<SaleInvoiceSelectedProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SaleInvoiceSelectedProductsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SaleInvoiceSelectedProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
