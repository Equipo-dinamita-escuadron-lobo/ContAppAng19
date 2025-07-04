import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdPartiesCreateComponent } from './third-parties-create.component';

describe('ThirdPartiesCreateComponent', () => {
  let component: ThirdPartiesCreateComponent;
  let fixture: ComponentFixture<ThirdPartiesCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdPartiesCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdPartiesCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
