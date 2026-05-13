import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { MajorAndBalancesComponent } from './major-and-balances.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('MajorAndBalancesComponent', () => {
  let component: MajorAndBalancesComponent;
  let fixture: ComponentFixture<MajorAndBalancesComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [MajorAndBalancesComponent],
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
        { provide: AuthService, useValue: { returnUserInfo: () => ({ id: 11 }) } },
      ],
    })
      .overrideComponent(MajorAndBalancesComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(MajorAndBalancesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads config with Libro Mayor name and 5 levels', () => {
    component.ngOnInit();
    expect(component.auxiliaryBookInfo.name).toBe('Libro Mayor');
    expect(component.levels.length).toBe(5);
  });

  it('organizeRequest formats both start and end dates', () => {
    component.ngOnInit();
    component.criteria.startDate = new Date(2025, 0, 15) as any;
    component.criteria.endDate = new Date(2025, 8, 30) as any;
    (component as any).organizeRequest();

    expect(component.request.type).toBe(AuxiliaryBookType.MAJOR_AND_BALANCES);
    expect(component.request.criteria.startDate).toBe('2025-01-15');
    expect(component.request.criteria.endDate).toBe('2025-09-30');
    expect(component.request.userId).toBe(11);
  });

  it('integration: generateReport with valid criteria triggers service', () => {
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [{ id: 1 }], auxiliaryBook: {} } as any),
    );
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.datePeriod = [new Date('2025-01-01'), new Date('2025-09-30')];
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
    expect(component.dataTable.length).toBe(1);
  });
});
