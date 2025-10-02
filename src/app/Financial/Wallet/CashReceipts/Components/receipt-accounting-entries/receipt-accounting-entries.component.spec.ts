import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptAccountingEntriesComponent } from './receipt-accounting-entries.component';

describe('ReceiptAccountingEntriesComponent', () => {
  let component: ReceiptAccountingEntriesComponent;
  let fixture: ComponentFixture<ReceiptAccountingEntriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptAccountingEntriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptAccountingEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
