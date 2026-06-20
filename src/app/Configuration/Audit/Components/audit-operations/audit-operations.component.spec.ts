import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditOperationsComponent } from './audit-operations.component';

describe('AuditOperationsComponent', () => {
  let component: AuditOperationsComponent;
  let fixture: ComponentFixture<AuditOperationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditOperationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
