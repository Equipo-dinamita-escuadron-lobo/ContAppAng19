import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdEditComponent } from './third-edit.component';

describe('ThirdEditComponent', () => {
  let component: ThirdEditComponent;
  let fixture: ComponentFixture<ThirdEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
