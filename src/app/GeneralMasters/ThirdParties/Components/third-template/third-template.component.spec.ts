import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdTemplateComponent } from './third-template.component';

describe('ThirdTemplateComponent', () => {
  let component: ThirdTemplateComponent;
  let fixture: ComponentFixture<ThirdTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
