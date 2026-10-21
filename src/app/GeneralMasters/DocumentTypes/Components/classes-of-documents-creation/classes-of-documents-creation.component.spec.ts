import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassesOfDocumentsCreationComponent } from './classes-of-documents-creation.component';

describe('ClassesOfDocumentsCreationComponent', () => {
  let component: ClassesOfDocumentsCreationComponent;
  let fixture: ComponentFixture<ClassesOfDocumentsCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesOfDocumentsCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesOfDocumentsCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
