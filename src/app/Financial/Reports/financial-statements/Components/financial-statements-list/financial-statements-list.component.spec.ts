import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementsListComponent } from './financial-statements-list.component';

describe('FinancialStatementsListComponent', () => {
  let component: FinancialStatementsListComponent;
  let fixture: ComponentFixture<FinancialStatementsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementsListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialStatementsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

