import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpCenterCreationComponent } from './help-center-creation.component';

describe('HelpCenterCreationComponent', () => {
  let component: HelpCenterCreationComponent;
  let fixture: ComponentFixture<HelpCenterCreationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpCenterCreationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpCenterCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
