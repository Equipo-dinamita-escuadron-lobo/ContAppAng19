import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdExportComponent } from './third-export.component';

describe('ThirdExportComponent', () => {
  let component: ThirdExportComponent;
  let fixture: ComponentFixture<ThirdExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
