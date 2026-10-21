import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportFinancialStatementComponent } from './export-financial-statement.component';

describe('ExportFinancialStatementComponent', () => {
  let component: ExportFinancialStatementComponent;
  let fixture: ComponentFixture<ExportFinancialStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportFinancialStatementComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportFinancialStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

