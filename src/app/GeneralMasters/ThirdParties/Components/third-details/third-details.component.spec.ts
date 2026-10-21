import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdDetailsComponent } from './third-details.component';

describe('ThirdDetailsComponent', () => {
  let component: ThirdDetailsComponent;
  let fixture: ComponentFixture<ThirdDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
