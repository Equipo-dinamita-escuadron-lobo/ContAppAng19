import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigurationValuationModelsComponent } from './configuration-valuation-models.component';

describe('ConfigurationValuationModelsComponent', () => {
  let component: ConfigurationValuationModelsComponent;
  let fixture: ComponentFixture<ConfigurationValuationModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigurationValuationModelsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigurationValuationModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
