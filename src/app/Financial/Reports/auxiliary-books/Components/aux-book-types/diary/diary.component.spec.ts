import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { DiaryComponent } from './diary.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('DiaryComponent', () => {
  let component: DiaryComponent;
  let fixture: ComponentFixture<DiaryComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [DiaryComponent],
      providers: [
        DatePipe,
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        {
          provide: EnterpriseService,
          useValue: { getSelectedEnterprise: () => ({ id: 'ent-1' }) },
        },
        {
          provide: ThirdService,
          useValue: jasmine.createSpyObj('ThirdService', ['getThirdList']),
        },
        {
          provide: ChartAccountService,
          useValue: jasmine.createSpyObj('ChartAccountService', ['getListAccounts']),
        },
        {
          provide: CostCenterService,
          useValue: jasmine.createSpyObj('CostCenterService', ['findActiveAuxiliary']),
        },
        { provide: MessageService, useValue: messageService },
        {
          provide: DialogService,
          useValue: jasmine.createSpyObj('DialogService', ['open']),
        },
        { provide: AuthService, useValue: { returnUserInfo: () => ({ id: 5 }) } },
      ],
    })
      .overrideComponent(DiaryComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(DiaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads config with diary name and 5 levels', () => {
    component.ngOnInit();
    expect(component.auxiliaryBookInfo.name).toBe('Libro Diario');
    expect(component.levels.length).toBe(5);
  });

  it('organizeRequest builds DIARY request from datePeriod', () => {
    component.ngOnInit();
    component.datePeriod = [new Date(2025, 0, 1), new Date(2025, 11, 31)];
    (component as any).organizeRequest();
    expect(component.request.type).toBe(AuxiliaryBookType.DIARY);
    expect(component.criteria.startDate).toBe('2025-01-01');
    expect(component.criteria.endDate).toBe('2025-12-31');
    expect(component.request.userId).toBe(5);
  });

  it('calculateTotals sums debit and credit', () => {
    component.dataTable = [
      { debit: 100, credit: 50 },
      { debit: 200, credit: 150 },
    ] as any;
    component.calculateTotals();
    expect(component.totalDebit).toBe(300);
    expect(component.totalCredit).toBe(200);
  });

  it('calculateTotals tolerates non-numeric values', () => {
    component.dataTable = [
      { debit: 'x' as any, credit: null as any },
      { debit: 50, credit: 25 },
    ] as any;
    component.calculateTotals();
    expect(component.totalDebit).toBe(50);
    expect(component.totalCredit).toBe(25);
  });

  it('integration: generateReport calls service and triggers totals', () => {
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({
        accountingData: [{ debit: 10, credit: 5 }],
        auxiliaryBook: {},
      } as any),
    );
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.datePeriod = [new Date('2025-01-01'), new Date('2025-12-31')];
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
    expect(component.totalDebit).toBe(10);
    expect(component.totalCredit).toBe(5);
  });
});
