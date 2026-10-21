import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostCentersFormComponent } from './cost-centers-form.component';

describe('CostCentersFormComponent', () => {
  let component: CostCentersFormComponent;
  let fixture: ComponentFixture<CostCentersFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostCentersFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostCentersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
