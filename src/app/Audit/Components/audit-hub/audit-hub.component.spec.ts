import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditHubComponent } from './audit-hub.component';

describe('AuditHubComponent', () => {
  let component: AuditHubComponent;
  let fixture: ComponentFixture<AuditHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditHubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
