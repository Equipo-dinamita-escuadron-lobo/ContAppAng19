import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesOfDocumentsEditComponent } from './classes-of-documents-edit.component';

describe('ClassesOfDocumentsEditComponent', () => {
  let component: ClassesOfDocumentsEditComponent;
  let fixture: ComponentFixture<ClassesOfDocumentsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesOfDocumentsEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesOfDocumentsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
