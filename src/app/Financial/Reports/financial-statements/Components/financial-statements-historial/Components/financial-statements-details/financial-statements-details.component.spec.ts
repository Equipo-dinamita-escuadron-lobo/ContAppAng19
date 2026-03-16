import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementsDetailsComponent } from './financial-statements-details.component';

describe('FinancialStatementsDetailsComponent', () => {
  let component: FinancialStatementsDetailsComponent;
  let fixture: ComponentFixture<FinancialStatementsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementsDetailsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialStatementsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

