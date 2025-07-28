import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEnterpriseComponent } from './create-enterprise.component';

describe('CreateEnterpriseComponent', () => {
  let component: CreateEnterpriseComponent;
  let fixture: ComponentFixture<CreateEnterpriseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEnterpriseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEnterpriseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
