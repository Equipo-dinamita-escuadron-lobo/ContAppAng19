import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryAndBalancesComponent } from './inventory-and-balances.component';

describe('InventoryAndBalancesComponent', () => {
  let component: InventoryAndBalancesComponent;
  let fixture: ComponentFixture<InventoryAndBalancesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryAndBalancesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryAndBalancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
