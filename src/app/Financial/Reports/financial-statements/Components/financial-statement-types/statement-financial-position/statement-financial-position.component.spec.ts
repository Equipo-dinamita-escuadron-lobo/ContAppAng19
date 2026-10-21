import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatementFinancialPositionComponent } from './statement-financial-position.component';

describe('StatementFinancialPositionComponent', () => {
  let component: StatementFinancialPositionComponent;
  let fixture: ComponentFixture<StatementFinancialPositionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatementFinancialPositionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatementFinancialPositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

