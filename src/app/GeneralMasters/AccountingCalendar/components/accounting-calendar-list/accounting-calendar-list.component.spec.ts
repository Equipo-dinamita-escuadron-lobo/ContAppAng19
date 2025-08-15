import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingCalendarListComponent } from './accounting-calendar-list.component';

describe('AccountingCalendarListComponent', () => {
  let component: AccountingCalendarListComponent;
  let fixture: ComponentFixture<AccountingCalendarListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingCalendarListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingCalendarListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
