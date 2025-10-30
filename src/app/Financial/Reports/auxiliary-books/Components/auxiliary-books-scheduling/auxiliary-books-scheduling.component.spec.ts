import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuxiliaryBooksSchedulingComponent } from './auxiliary-books-scheduling.component';

describe('AuxiliaryBooksSchedulingComponent', () => {
  let component: AuxiliaryBooksSchedulingComponent;
  let fixture: ComponentFixture<AuxiliaryBooksSchedulingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksSchedulingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksSchedulingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
