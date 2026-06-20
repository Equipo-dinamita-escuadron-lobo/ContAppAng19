import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitOfMeasureCreationComponent } from './unit-of-measure-creation.component';

describe('UnitOfMeasureCreationComponent', () => {
  let component: UnitOfMeasureCreationComponent;
  let fixture: ComponentFixture<UnitOfMeasureCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UnitOfMeasureCreationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitOfMeasureCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
