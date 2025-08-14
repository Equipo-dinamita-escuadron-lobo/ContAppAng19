import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTypesEditComponent } from './document-types-edit.component';

describe('DocumentTypesEditComponent', () => {
  let component: DocumentTypesEditComponent;
  let fixture: ComponentFixture<DocumentTypesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentTypesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
