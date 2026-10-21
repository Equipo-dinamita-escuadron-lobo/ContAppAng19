import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThirdConfigComponent } from './third-config.component';

describe('ThirdConfigComponent', () => {
  let component: ThirdConfigComponent;
  let fixture: ComponentFixture<ThirdConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThirdConfigComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThirdConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
