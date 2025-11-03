import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuxiliaryBooksDetailsComponent } from './auxiliary-books-details.component';

describe('AuxiliaryBooksDetailsComponent', () => {
  let component: AuxiliaryBooksDetailsComponent;
  let fixture: ComponentFixture<AuxiliaryBooksDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
