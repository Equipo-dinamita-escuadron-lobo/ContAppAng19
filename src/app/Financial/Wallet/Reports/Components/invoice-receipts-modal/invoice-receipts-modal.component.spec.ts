import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceReceiptsModalComponent } from './invoice-receipts-modal.component';

describe('InvoiceReceiptsModalComponent', () => {
  let component: InvoiceReceiptsModalComponent;
  let fixture: ComponentFixture<InvoiceReceiptsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceReceiptsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceReceiptsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
