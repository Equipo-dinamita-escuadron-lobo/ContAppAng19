import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdCreationComponent } from './third-creation.component';

describe('ThirdCreationComponent', () => {
  let component: ThirdCreationComponent;
  let fixture: ComponentFixture<ThirdCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
