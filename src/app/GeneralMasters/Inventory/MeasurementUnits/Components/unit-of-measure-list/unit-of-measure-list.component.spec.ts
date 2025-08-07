import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitOfMeasureListComponent } from './unit-of-measure-list.component';

describe('UnitOfMeasureListComponent', () => {
  let component: UnitOfMeasureListComponent;
  let fixture: ComponentFixture<UnitOfMeasureListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnitOfMeasureListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitOfMeasureListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
