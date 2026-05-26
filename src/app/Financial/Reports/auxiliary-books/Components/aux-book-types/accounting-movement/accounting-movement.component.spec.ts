import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { AccountingMovementComponent } from './accounting-movement.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('AccountingMovementComponent', () => {
  let component: AccountingMovementComponent;
  let fixture: ComponentFixture<AccountingMovementComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let enterpriseService: jasmine.SpyObj<EnterpriseService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    enterpriseService = jasmine.createSpyObj('EnterpriseService', [
      'getSelectedEnterprise',
    ]);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    enterpriseService.getSelectedEnterprise.and.returnValue({ id: 'ent-1' } as any);

    await TestBed.configureTestingModule({
      imports: [AccountingMovementComponent],
      providers: [
        DatePipe,
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: EnterpriseService, useValue: enterpriseService },
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
        {
          provide: AuthService,
          useValue: { returnUserInfo: () => ({ id: 7 }) },
        },
      ],
    })
      .overrideComponent(AccountingMovementComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(AccountingMovementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads config with movimiento name and icon', () => {
    component.ngOnInit();
    expect(component.auxiliaryBookInfo.name).toBe('Movimiento de Contabilidad');
    expect(component.auxiliaryBookInfo.icon).toBe('difference');
  });

  it('onDocumentTypeOptionSelected toggles documentTypeSelected', () => {
    component.documentTypeSelected = false;
    component.onDocumentTypeOptionSelected();
    expect(component.documentTypeSelected).toBeTrue();
    component.onDocumentTypeOptionSelected();
    expect(component.documentTypeSelected).toBeFalse();
  });

  it('onSelectDocumentType sets documentTypeSelected to true', () => {
    component.documentTypeSelected = false;
    component.onSelectDocumentType();
    expect(component.documentTypeSelected).toBeTrue();
  });

  it('organizeRequest forces criteriaType ACCOUNT and INVENTORY_AND_BALANCES type', () => {
    component.ngOnInit();
    component.criteria.endDate = new Date('2025-09-15') as any;
    (component as any).organizeRequest();
    expect(component.criteria.criteriaType).toBe('ACCOUNT');
    expect(component.request.type).toBe(AuxiliaryBookType.INVENTORY_AND_BALANCES);
    expect(component.request.entId).toBe('ent-1');
    expect(component.request.userId).toBe(7);
  });

  it('integration: generateReport dispatches request when criteria valid', () => {
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [{ id: 1 }], auxiliaryBook: {} } as any),
    );
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.datePeriod = [new Date('2025-01-01'), new Date('2025-06-30')];
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
    expect(component.dataTable.length).toBe(1);
  });
});
