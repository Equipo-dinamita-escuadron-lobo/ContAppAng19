import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgingPorfolioReportComponent } from './aging-porfolio-report.component';

describe('AgingPorfolioReportComponent', () => {
  let component: AgingPorfolioReportComponent;
  let fixture: ComponentFixture<AgingPorfolioReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgingPorfolioReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgingPorfolioReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
