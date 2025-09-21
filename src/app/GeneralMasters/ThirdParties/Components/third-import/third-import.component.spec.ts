import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdImportComponent } from './third-import.component';

describe('ThirdImportComponent', () => {
  let component: ThirdImportComponent;
  let fixture: ComponentFixture<ThirdImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
