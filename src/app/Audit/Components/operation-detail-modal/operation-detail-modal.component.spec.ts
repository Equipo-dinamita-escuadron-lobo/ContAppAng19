import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationDetailModalComponent } from './operation-detail-modal.component';

describe('OperationDetailModalComponent', () => {
  let component: OperationDetailModalComponent;
  let fixture: ComponentFixture<OperationDetailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationDetailModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
