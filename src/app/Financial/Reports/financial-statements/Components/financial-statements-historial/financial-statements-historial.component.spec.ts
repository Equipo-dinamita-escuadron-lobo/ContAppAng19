import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinancialStatementsHistorialComponent } from './financial-statements-historial.component';

describe('FinancialStatementsHistorialComponent', () => {
  let component: FinancialStatementsHistorialComponent;
  let fixture: ComponentFixture<FinancialStatementsHistorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialStatementsHistorialComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialStatementsHistorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

