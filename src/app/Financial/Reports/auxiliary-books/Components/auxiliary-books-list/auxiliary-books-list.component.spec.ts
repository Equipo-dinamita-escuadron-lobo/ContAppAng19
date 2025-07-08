import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuxiliaryBooksListComponent } from './auxiliary-books-list.component';

describe('AuxiliaryBooksListComponent', () => {
  let component: AuxiliaryBooksListComponent;
  let fixture: ComponentFixture<AuxiliaryBooksListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
