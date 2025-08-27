import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingMovementComponent } from './accounting-movement.component';

describe('AccountingMovementComponent', () => {
  let component: AccountingMovementComponent;
  let fixture: ComponentFixture<AccountingMovementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingMovementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingMovementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
