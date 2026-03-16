import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementsSchedulingComponent } from './financial-statements-scheduling.component';

describe('FinancialStatementsSchedulingComponent', () => {
  let component: FinancialStatementsSchedulingComponent;
  let fixture: ComponentFixture<FinancialStatementsSchedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementsSchedulingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialStatementsSchedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

