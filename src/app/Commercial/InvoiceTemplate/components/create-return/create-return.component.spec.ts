import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateReturnComponent } from './create-return.component';

describe('CreateReturnComponent', () => {
  let component: CreateReturnComponent;
  let fixture: ComponentFixture<CreateReturnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateReturnComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateReturnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
