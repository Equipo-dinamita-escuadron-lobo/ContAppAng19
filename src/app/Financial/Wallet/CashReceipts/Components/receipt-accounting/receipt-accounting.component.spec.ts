import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptAccountingComponent } from './receipt-accounting.component';

describe('ReceiptAccountingComponent', () => {
  let component: ReceiptAccountingComponent;
  let fixture: ComponentFixture<ReceiptAccountingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptAccountingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptAccountingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
