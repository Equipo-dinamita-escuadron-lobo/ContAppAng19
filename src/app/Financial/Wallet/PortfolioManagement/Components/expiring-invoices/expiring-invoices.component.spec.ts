import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpiringInvoicesComponent } from './expiring-invoices.component';

describe('ExpiringInvoicesComponent', () => {
  let component: ExpiringInvoicesComponent;
  let fixture: ComponentFixture<ExpiringInvoicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpiringInvoicesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpiringInvoicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
