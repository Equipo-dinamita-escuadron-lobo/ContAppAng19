import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentTypesCreationComponent } from './document-types-creation.component';

describe('DocumentTypesCreationComponent', () => {
  let component: DocumentTypesCreationComponent;
  let fixture: ComponentFixture<DocumentTypesCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypesCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentTypesCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
