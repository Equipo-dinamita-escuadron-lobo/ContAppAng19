import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuxiliaryBooksHistorialComponent } from './auxiliary-books-historial.component';

describe('AuxiliaryBooksHistorialComponent', () => {
  let component: AuxiliaryBooksHistorialComponent;
  let fixture: ComponentFixture<AuxiliaryBooksHistorialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksHistorialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksHistorialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
