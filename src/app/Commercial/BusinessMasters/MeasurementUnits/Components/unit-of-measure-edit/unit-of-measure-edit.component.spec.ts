import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitOfMeasureEditComponent } from './unit-of-measure-edit.component';

describe('UnitOfMeasureEditComponent', () => {
  let component: UnitOfMeasureEditComponent;
  let fixture: ComponentFixture<UnitOfMeasureEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnitOfMeasureEditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitOfMeasureEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
