import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementOfChangesInEquityComponent } from './statement-of-changes-in-equity.component';

describe('StatementOfChangesInEquityComponent', () => {
  let component: StatementOfChangesInEquityComponent;
  let fixture: ComponentFixture<StatementOfChangesInEquityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementOfChangesInEquityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatementOfChangesInEquityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

