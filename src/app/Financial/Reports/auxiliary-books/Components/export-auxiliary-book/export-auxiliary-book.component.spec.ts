import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExportAuxiliaryBookComponent } from './export-auxiliary-book.component';

describe('ExportAuxiliaryBookComponent', () => {
  let component: ExportAuxiliaryBookComponent;
  let fixture: ComponentFixture<ExportAuxiliaryBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportAuxiliaryBookComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExportAuxiliaryBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
