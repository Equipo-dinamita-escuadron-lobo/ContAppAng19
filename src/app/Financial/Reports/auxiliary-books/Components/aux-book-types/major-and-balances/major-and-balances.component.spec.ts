import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MajorAndBalancesComponent } from './major-and-balances.component';

describe('MajorAndBalancesComponent', () => {
  let component: MajorAndBalancesComponent;
  let fixture: ComponentFixture<MajorAndBalancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MajorAndBalancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MajorAndBalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
