import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptCreationComponent } from './receipt-creation.component';

describe('ReceiptCreationComponent', () => {
  let component: ReceiptCreationComponent;
  let fixture: ComponentFixture<ReceiptCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
