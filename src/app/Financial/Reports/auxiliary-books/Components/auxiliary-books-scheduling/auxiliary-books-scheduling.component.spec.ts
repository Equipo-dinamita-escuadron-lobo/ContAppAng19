import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { AuxiliaryBooksSchedulingComponent } from './auxiliary-books-scheduling.component';
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { AuthService } from '../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../Models/eAuxiliaryBookType';

describe('AuxiliaryBooksSchedulingComponent', () => {
  let component: AuxiliaryBooksSchedulingComponent;
  let fixture: ComponentFixture<AuxiliaryBooksSchedulingComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let enterpriseService: jasmine.SpyObj<EnterpriseService>;
  let authService: jasmine.SpyObj<AuthService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let dialogRef: jasmine.SpyObj<DynamicDialogRef>;

  const setupTestBed = async (configData: any = null) => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'createScheduledReport',
      'updateScheduledReport',
      'cancelScheduledReport',
    ]);
    enterpriseService = jasmine.createSpyObj('EnterpriseService', [
      'getSelectedEnterprise',
    ]);
    authService = jasmine.createSpyObj('AuthService', ['returnUserInfo']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    dialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);

    enterpriseService.getSelectedEnterprise.and.returnValue({ id: 'ent-1' } as any);
    authService.returnUserInfo.and.returnValue({
      id: 1,
      email: 'user@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      username: 'ada',
    } as any);

    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksSchedulingComponent, ReactiveFormsModule],
      providers: [
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: EnterpriseService, useValue: enterpriseService },
        { provide: AuthService, useValue: authService },
        { provide: MessageService, useValue: messageService },
        { provide: DynamicDialogConfig, useValue: { data: configData } },
        { provide: DynamicDialogRef, useValue: dialogRef },
      ],
    })
      .overrideComponent(AuxiliaryBooksSchedulingComponent, {
        set: { template: '', providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksSchedulingComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  };

  it('should create with default initial state', async () => {
    await setupTestBed();
    expect(component).toBeTruthy();
    expect(component.scheduleForm).toBeDefined();
    expect(component.isEditingSchedule).toBeFalse();
    expect(component.dialogTitle).toBe('Programar Reporte');
  });

  it('hydrates state from existing schedule data', async () => {
    await setupTestBed({
      type: 'DIARY',
      bookName: 'Libro Diario',
      scheduleId: 'sched-1',
      frequency: 'WEEKLY',
      deliveryWay: 'EMAIL',
      email: 'a@b.com',
      startAt: '2099-01-01T00:00:00.000Z',
      criteria: {
        criteriaType: 'ACCOUNT',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
    });
    expect(component.isEditingSchedule).toBeTrue();
    expect(component.isBookTypeLocked).toBeTrue();
    expect(component.scheduleForm.getRawValue().bookType).toBe(
      AuxiliaryBookType.DIARY,
    );
    expect(component.scheduleForm.getRawValue().frequency).toBe('WEEKLY');
    expect(component.scheduleForm.getRawValue().email).toBe('a@b.com');
  });

  it('setFrequency / setDeliveryWay update controls', async () => {
    await setupTestBed();
    component.setFrequency('MONTHLY');
    expect(component.isFrequencySelected('MONTHLY')).toBeTrue();
    component.setDeliveryWay('EMAIL');
    expect(component.isDeliveryWaySelected('EMAIL')).toBeTrue();
    expect(component.requiresEmailConfig('EMAIL')).toBeTrue();
    expect(component.requiresEmailConfig('DOWNLOAD')).toBeFalse();
  });

  it('isRangeInvalid returns true when from >= to', async () => {
    await setupTestBed();
    component.control('useAccountRange')?.setValue(true);
    component.control('rangeFrom')?.setValue(10);
    component.control('rangeTo')?.setValue(5);
    expect(component.isRangeInvalid()).toBeTrue();
    component.control('rangeTo')?.setValue(50);
    expect(component.isRangeInvalid()).toBeFalse();
  });

  it('isCriteriaDateRangeInvalid checks ordering', async () => {
    await setupTestBed();
    component.control('criteriaStartDate')?.setValue(new Date('2025-12-01'));
    component.control('criteriaEndDate')?.setValue(new Date('2025-01-01'));
    expect(component.isCriteriaDateRangeInvalid()).toBeTrue();
  });

  it('isStartAtInvalid flags past dates', async () => {
    await setupTestBed();
    component.control('startAt')?.setValue(new Date('2000-01-01'));
    expect(component.isStartAtInvalid()).toBeTrue();
  });

  it('onSubmit reports validation errors when form is invalid', async () => {
    await setupTestBed();
    component.scheduleForm.reset();
    component.onSubmit();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
    expect(auxiliaryBookService.createScheduledReport).not.toHaveBeenCalled();
  });

  it('onSubmit calls createScheduledReport when not editing', fakeAsync(async () => {
    await setupTestBed();
    auxiliaryBookService.createScheduledReport.and.returnValue(
      of({ publicId: 'created-1' } as any),
    );

    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    component.control('bookType')?.setValue(AuxiliaryBookType.DIARY);
    component.control('criteriaType')?.setValue('ACCOUNT');
    component.control('criteriaStartDate')?.setValue(new Date('2025-01-01'));
    component.control('criteriaEndDate')?.setValue(new Date('2025-12-31'));
    component.control('startAt')?.setValue(future);
    component.control('frequency')?.setValue('DAILY');
    component.control('deliveryWay')?.setValue('DOWNLOAD');

    component.onSubmit();
    tick(1000);
    expect(auxiliaryBookService.createScheduledReport).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
  }));

  it('onSubmit calls updateScheduledReport when editing with string scheduleId', fakeAsync(async () => {
    await setupTestBed({
      type: 'DIARY',
      scheduleId: 'sched-1',
      frequency: 'DAILY',
      criteria: {
        criteriaType: 'ACCOUNT',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
    });
    auxiliaryBookService.updateScheduledReport.and.returnValue(
      of({ publicId: 'sched-1' } as any),
    );
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    component.control('startAt')?.setValue(future);

    component.onSubmit();
    tick(1000);
    expect(auxiliaryBookService.updateScheduledReport).toHaveBeenCalledWith(
      'sched-1',
      jasmine.any(Object),
    );
  }));

  it('onSubmit handles service error gracefully', fakeAsync(async () => {
    await setupTestBed();
    auxiliaryBookService.createScheduledReport.and.returnValue(
      throwError(() => ({ message: 'fail' })),
    );
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    component.control('bookType')?.setValue(AuxiliaryBookType.DIARY);
    component.control('criteriaType')?.setValue('ACCOUNT');
    component.control('criteriaStartDate')?.setValue(new Date('2025-01-01'));
    component.control('criteriaEndDate')?.setValue(new Date('2025-12-31'));
    component.control('startAt')?.setValue(future);
    component.control('frequency')?.setValue('DAILY');
    component.control('deliveryWay')?.setValue('DOWNLOAD');

    component.onSubmit();
    tick();
    expect(component.isSubmitting).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
  }));

  it('confirmDeleteSchedule cancels existing schedule', fakeAsync(async () => {
    await setupTestBed({
      type: 'DIARY',
      scheduleId: 'sched-1',
      frequency: 'DAILY',
      criteria: {
        criteriaType: 'ACCOUNT',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
      },
    });
    auxiliaryBookService.cancelScheduledReport.and.returnValue(of(void 0));
    component.confirmDeleteSchedule();
    tick(1000);
    expect(auxiliaryBookService.cancelScheduledReport).toHaveBeenCalledWith(
      'sched-1',
    );
  }));

  it('confirmDeleteSchedule shows error if no schedule id', async () => {
    await setupTestBed();
    component.isEditingSchedule = true;
    component.confirmDeleteSchedule();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
  });

  it('getStatusSeverity returns correct severity', async () => {
    await setupTestBed();
    expect(component.getStatusSeverity('COMPLETED')).toBe('success');
    expect(component.getStatusSeverity('FAIL')).toBe('danger');
    expect(component.getStatusSeverity('GENERATING')).toBe('info');
    expect(component.getStatusSeverity('UNKNOWN')).toBe('warning');
  });

  it('close uses dialogRef when provided', async () => {
    await setupTestBed();
    component.close(null);
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });

  it('requestDeleteSchedule / cancelDeleteRequest toggle confirmation flag', async () => {
    await setupTestBed();
    component.requestDeleteSchedule();
    expect(component.showDeleteConfirmation).toBeTrue();
    component.cancelDeleteRequest();
    expect(component.showDeleteConfirmation).toBeFalse();
  });
});
