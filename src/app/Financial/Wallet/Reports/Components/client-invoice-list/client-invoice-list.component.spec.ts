import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientInvoiceListComponent } from './client-invoice-list.component';

describe('ClientInvoiceListComponent', () => {
  let component: ClientInvoiceListComponent;
  let fixture: ComponentFixture<ClientInvoiceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientInvoiceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientInvoiceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
