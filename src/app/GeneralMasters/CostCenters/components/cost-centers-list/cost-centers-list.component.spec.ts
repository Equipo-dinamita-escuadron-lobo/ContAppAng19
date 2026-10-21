import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostCentersListComponent } from './cost-centers-list.component';

describe('CostCentersListComponent', () => {
  let component: CostCentersListComponent;
  let fixture: ComponentFixture<CostCentersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CostCentersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CostCentersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
