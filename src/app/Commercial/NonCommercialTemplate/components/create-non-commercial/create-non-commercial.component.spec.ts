import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateNonCommercialComponent } from './create-non-commercial.component';

describe('CreateNonCommercialComponent', () => {
  let component: CreateNonCommercialComponent;
  let fixture: ComponentFixture<CreateNonCommercialComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateNonCommercialComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateNonCommercialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
