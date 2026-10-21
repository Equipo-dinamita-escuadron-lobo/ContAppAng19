import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditAccountingDocumentsComponent } from './audit-accounting-documents.component';

describe('AuditAccountingDocumentsComponent', () => {
  let component: AuditAccountingDocumentsComponent;
  let fixture: ComponentFixture<AuditAccountingDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditAccountingDocumentsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditAccountingDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
