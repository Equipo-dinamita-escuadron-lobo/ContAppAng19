import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditSystemComponent } from './audit-system.component';

describe('AuditSystemComponent', () => {
  let component: AuditSystemComponent;
  let fixture: ComponentFixture<AuditSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditSystemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
