import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditConsecutiveComponent } from './audit-consecutive.component';

describe('AuditConsecutiveComponent', () => {
  let component: AuditConsecutiveComponent;
  let fixture: ComponentFixture<AuditConsecutiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditConsecutiveComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditConsecutiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
