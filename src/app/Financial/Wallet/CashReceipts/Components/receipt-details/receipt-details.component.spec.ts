import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptDetailsComponent } from './receipt-details.component';

describe('ReceiptDetailsComponent', () => {
  let component: ReceiptDetailsComponent;
  let fixture: ComponentFixture<ReceiptDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
