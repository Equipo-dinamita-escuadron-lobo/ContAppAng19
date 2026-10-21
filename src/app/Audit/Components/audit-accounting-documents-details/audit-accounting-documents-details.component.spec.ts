import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditAccountingDocumentsDetailsComponent } from './audit-accounting-documents-details.component';

describe('AuditAccountingDocumentsDetailsComponent', () => {
  let component: AuditAccountingDocumentsDetailsComponent;
  let fixture: ComponentFixture<AuditAccountingDocumentsDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditAccountingDocumentsDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditAccountingDocumentsDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
