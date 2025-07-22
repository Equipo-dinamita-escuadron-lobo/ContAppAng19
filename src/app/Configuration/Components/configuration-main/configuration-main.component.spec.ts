import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationMainComponent } from './configuration-main.component';

describe('ConfigurationMainComponent', () => {
  let component: ConfigurationMainComponent;
  let fixture: ComponentFixture<ConfigurationMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationMainComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
