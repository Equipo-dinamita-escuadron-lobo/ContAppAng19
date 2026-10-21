import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesOfDocumentsListComponent } from './classes-of-documents-list.component';

describe('ClassesOfDocumentsListComponent', () => {
  let component: ClassesOfDocumentsListComponent;
  let fixture: ComponentFixture<ClassesOfDocumentsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesOfDocumentsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesOfDocumentsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
