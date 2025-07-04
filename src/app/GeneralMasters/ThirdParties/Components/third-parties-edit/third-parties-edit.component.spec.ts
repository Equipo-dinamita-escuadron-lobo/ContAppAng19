import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdPartiesEditComponent } from './third-parties-edit.component';

describe('ThirdPartiesEditComponent', () => {
  let component: ThirdPartiesEditComponent;
  let fixture: ComponentFixture<ThirdPartiesEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdPartiesEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdPartiesEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
