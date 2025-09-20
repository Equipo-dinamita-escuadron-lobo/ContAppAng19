import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdCreationPdfRutComponent } from './third-creation-pdf-rut.component';

describe('ThirdCreationPdfRutComponent', () => {
  let component: ThirdCreationPdfRutComponent;
  let fixture: ComponentFixture<ThirdCreationPdfRutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdCreationPdfRutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdCreationPdfRutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
