import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { InventoryAndBalancesComponent } from './inventory-and-balances.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('InventoryAndBalancesComponent', () => {
  let component: InventoryAndBalancesComponent;
  let fixture: ComponentFixture<InventoryAndBalancesComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [InventoryAndBalancesComponent],
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
        { provide: AuthService, useValue: { returnUserInfo: () => ({ id: 9 }) } },
      ],
    })
      .overrideComponent(InventoryAndBalancesComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(InventoryAndBalancesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads config with INVENTORY_AND_BALANCES type and 5 levels', () => {
    component.ngOnInit();
    expect(component.auxiliaryBookInfo.type).toBe(
      AuxiliaryBookType.INVENTORY_AND_BALANCES,
    );
    expect(component.levels.length).toBe(5);
  });

  it('organizeRequest builds request with current end date', () => {
    component.ngOnInit();
    component.criteria.endDate = new Date(2025, 11, 31) as any;
    (component as any).organizeRequest();
    expect(component.request.type).toBe(AuxiliaryBookType.INVENTORY_AND_BALANCES);
    expect(component.request.criteria.endDate).toBe('2025-12-31');
    expect(component.criteria.endDate instanceof Date).toBeTrue();
    expect(component.request.entId).toBe('ent-1');
  });

  it('integration: generateReport requires endDate (cut-off date)', () => {
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [], auxiliaryBook: {} } as any),
    );
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.criteria.endDate = new Date('2025-12-31') as any;
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
  });

  it('integration: generateReport fails validation when no endDate', () => {
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).not.toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalled();
  });
});
