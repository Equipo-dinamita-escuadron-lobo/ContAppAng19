import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceSelectionComponent } from './invoice-selection.component';

describe('InvoiceSelectionComponent', () => {
  let component: InvoiceSelectionComponent;
  let fixture: ComponentFixture<InvoiceSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceSelectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
