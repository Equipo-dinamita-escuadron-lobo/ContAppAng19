import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { ThirdPartyBookComponent } from './third-party-book.component';
import { AuxiliaryBooksServiceService } from '../../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../../GeneralMasters/Enterprise/services/enterprise.service';
import { ThirdService } from '../../../../../../GeneralMasters/ThirdParties/Services/third.service';
import { ChartAccountService } from '../../../../../../GeneralMasters/AccountCatalogue/services/chart-account.service';
import { CostCenterService } from '../../../../../../GeneralMasters/CostCenters/services/cost-center.service';
import { AuthService } from '../../../../../../Core/auth/services/auth.service';
import { AuxiliaryBookType } from '../../../Models/eAuxiliaryBookType';

describe('ThirdPartyBookComponent', () => {
  let component: ThirdPartyBookComponent;
  let fixture: ComponentFixture<ThirdPartyBookComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let thirdService: jasmine.SpyObj<ThirdService>;
  let messageService: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'registerAuxiliaryBook',
    ]);
    thirdService = jasmine.createSpyObj('ThirdService', ['getThirdList']);
    thirdService.getThirdList.and.returnValue(of([]));
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ThirdPartyBookComponent],
      providers: [
        DatePipe,
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        {
          provide: EnterpriseService,
          useValue: { getSelectedEnterprise: () => ({ id: 'ent-1' }) },
        },
        { provide: ThirdService, useValue: thirdService },
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
        { provide: AuthService, useValue: { returnUserInfo: () => ({ id: 3 }) } },
      ],
    })
      .overrideComponent(ThirdPartyBookComponent, { set: { template: '', providers: [] } })
      .compileComponents();

    fixture = TestBed.createComponent(ThirdPartyBookComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loadConfig forces isThirdPartyOptionSelected and triggers third list fetch', () => {
    component.enterpriseData = { id: 'ent-1' };
    component.ngOnInit();
    expect(component.isThirdPartyOptionSelected).toBeTrue();
    expect(thirdService.getThirdList).toHaveBeenCalledWith('ent-1');
    expect(component.auxiliaryBookInfo.name).toBe('Libro Auxiliar por Tercero');
  });

  it('generateReport blocks when no thirdPartyId selected', () => {
    component.enterpriseData = { id: 'ent-1' };
    component.ngOnInit();
    component.criteria.thirdPartyId = null;
    (component as any).generateReport();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ summary: 'Tercero requerido' }),
    );
    expect(auxiliaryBookService.registerAuxiliaryBook).not.toHaveBeenCalled();
  });

  it('generateReport delegates to super when thirdPartyId is set', () => {
    auxiliaryBookService.registerAuxiliaryBook.and.returnValue(
      of({ accountingData: [], auxiliaryBook: {} } as any),
    );
    component.enterpriseData = { id: 'ent-1' };
    component.ngOnInit();
    component.criteria.criteriaType = 'ACCOUNT';
    component.isLevelSelected = true;
    component.criteria.thirdPartyId = 99;
    component.datePeriod = [new Date(2025, 0, 1), new Date(2025, 11, 31)];
    (component as any).generateReport();
    expect(auxiliaryBookService.registerAuxiliaryBook).toHaveBeenCalled();
  });

  it('organizeRequest builds THIRD_PARTY request', () => {
    component.enterpriseData = { id: 'ent-1' };
    component.ngOnInit();
    component.criteria.endDate = new Date(2025, 11, 31) as any;
    (component as any).organizeRequest();
    expect(component.request.type).toBe(AuxiliaryBookType.THIRD_PARTY);
    expect(component.request.entId).toBe('ent-1');
    expect(component.request.userId).toBe(3);
  });
});
