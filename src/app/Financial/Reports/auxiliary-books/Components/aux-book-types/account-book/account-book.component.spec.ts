import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { AccountBookComponent } from './account-book.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('AccountBookComponent', () => {
  let component: AccountBookComponent;
  let fixture: ComponentFixture<AccountBookComponent>;

  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let enterpriseService: jasmine.SpyObj<EnterpriseService>;
  let thirdService: jasmine.SpyObj<ThirdService>;
  let chartAccountService: jasmine.SpyObj<ChartAccountService>;
  let messageService: jasmine.SpyObj<MessageService>;
  let dialogService: jasmine.SpyObj<DialogService>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    enterpriseService = jasmine.createSpyObj('EnterpriseService', [
      'getSelectedEnterprise',
    ]);
    thirdService = jasmine.createSpyObj('ThirdService', ['getThirdList']);
    chartAccountService = jasmine.createSpyObj('ChartAccountService', [
      'getListAccounts',
    ]);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    dialogService = jasmine.createSpyObj('DialogService', ['open']);
    authService = jasmine.createSpyObj('AuthService', ['returnUserInfo']);

    enterpriseService.getSelectedEnterprise.and.returnValue({ id: 'ent-1' } as any);
    authService.returnUserInfo.and.returnValue({ id: 42 } as any);

    await TestBed.configureTestingModule({
      imports: [AccountBookComponent],
      providers: [
        DatePipe,
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: EnterpriseService, useValue: enterpriseService },
        { provide: ThirdService, useValue: thirdService },
        { provide: ChartAccountService, useValue: chartAccountService },
        {
          provide: CostCenterService,
          useValue: jasmine.createSpyObj('CostCenterService', ['findActiveAuxiliary']),
        },
        { provide: MessageService, useValue: messageService },
        { provide: DialogService, useValue: dialogService },
        { provide: AuthService, useValue: authService },
      ],
    })
      .overrideComponent(AccountBookComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(AccountBookComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads config on ngOnInit with name, description and levels', () => {
    component.ngOnInit();
    expect(component.auxiliaryBookInfo.name).toBe('Libro Auxiliar por Cuenta');
    expect(component.levels.length).toBe(3);
    expect(component.enterpriseData).toEqual({ id: 'ent-1' } as any);
  });

  it('organizeRequest builds request with selected enterprise and user', () => {
    component.ngOnInit();
    component.criteria.endDate = new Date('2025-06-30') as any;
    (component as any).organizeRequest();

    expect(component.request.entId).toBe('ent-1');
    expect(component.request.userId).toBe(42);
    expect(component.request.type).toBe(AuxiliaryBookType.ACCOUNT);
    expect(component.request.criteria.startDate).toBe('2025-01-01');
  });

  it('organizeRequest falls back to empty entId / userId 0 when missing', () => {
    enterpriseService.getSelectedEnterprise.and.returnValue(null as any);
    authService.returnUserInfo.and.returnValue(null);
    component.ngOnInit();
    component.criteria.endDate = new Date('2025-06-30') as any;
    (component as any).organizeRequest();
    expect(component.request.entId).toBe('');
    expect(component.request.userId).toBe(0);
  });

  it('generateReport pushes error toast when criteria is invalid', () => {
    component.ngOnInit();
    (component as any).generateReport();
    expect(messageService.add).toHaveBeenCalled();
    expect(auxiliaryBookService.registerAuxiliaryBook).not.toHaveBeenCalled();
  });

  it('generateReport calls service and stores data on success', () => {
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.datePeriod = [new Date('2025-01-01'), new Date('2025-12-31')];

    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [{ a: 1 }], auxiliaryBook: { publicId: 'p' } } as any),
    );

    (component as any).generateReport();

    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
    expect(component.dataTable.length).toBe(1);
    expect(component.isReportGenerated).toBeTrue();
  });

  it('generateReport handles service error', () => {
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.datePeriod = [new Date('2025-01-01'), new Date('2025-12-31')];

    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      throwError(() => new Error('boom')),
    );

    (component as any).generateReport();
    expect(messageService.add).toHaveBeenCalled();
  });

  it('integration: full flow level -> range -> report success', () => {
    chartAccountService.getListAccounts.and.returnValue(
      of([{ code: '1', children: [{ code: '11', children: [{ code: '1105', children: [] }] }] }] as any),
    );
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [], auxiliaryBook: {} } as any),
    );

    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.onLevelChange();
    expect(component.isLevelSelected).toBeTrue();

    component.isRangeOptionSelected = true;
    component.onRangeSelectionChange();
    expect(chartAccountService.getListAccounts).toHaveBeenCalledWith('ent-1');

    component.datePeriod = [new Date('2025-01-01'), new Date('2025-12-31')];
    (component as any).generateReport();
    expect(messageService.add).toHaveBeenCalled();
  });

  it('formatMoneyAligned returns empty string for null', () => {
    expect(component.formatMoneyAligned(null)).toBe('');
  });

  it('formatMoneyAligned marks credit with positive value as red', () => {
    const html = component.formatMoneyAligned(100, 'CREDITO');
    expect(html).toContain('text-red-600');
  });
});
