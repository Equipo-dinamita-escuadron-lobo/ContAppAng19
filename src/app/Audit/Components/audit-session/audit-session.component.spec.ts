import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditSessionComponent } from './audit-session.component';

describe('AuditSessionComponent', () => {
  let component: AuditSessionComponent;
  let fixture: ComponentFixture<AuditSessionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditSessionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditSessionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
