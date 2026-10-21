import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';

import { AuxiliaryBooksHistorialComponent } from './auxiliary-books-historial.component';
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';
import { EnterpriseService } from '../../../../../GeneralMasters/Enterprise/services/enterprise.service';

describe('AuxiliaryBooksHistorialComponent', () => {
  let component: AuxiliaryBooksHistorialComponent;
  let fixture: ComponentFixture<AuxiliaryBooksHistorialComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let enterpriseService: jasmine.SpyObj<EnterpriseService>;
  let router: jasmine.SpyObj<Router>;
  let messageService: jasmine.SpyObj<MessageService>;
  let dialogService: jasmine.SpyObj<DialogService>;

  const buildPage = (content: any[] = [], totalElements = 0): any => ({
    success: true,
    message: '',
    code: 200,
    data: { content, totalElements },
  });

  beforeEach(async () => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'getHistoryByEnterprise',
    ]);
    enterpriseService = jasmine.createSpyObj('EnterpriseService', [
      'getSelectedEnterprise',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);
    dialogService = jasmine.createSpyObj('DialogService', ['open']);

    enterpriseService.getSelectedEnterprise.and.returnValue({ id: 'ent-1' } as any);

    await TestBed.configureTestingModule({
      imports: [AuxiliaryBooksHistorialComponent],
      providers: [
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: EnterpriseService, useValue: enterpriseService },
        { provide: Router, useValue: router },
        { provide: MessageService, useValue: messageService },
        { provide: ConfirmationService, useValue: {} },
        { provide: DialogService, useValue: dialogService },
      ],
    })
      .overrideComponent(AuxiliaryBooksHistorialComponent, {
        set: { template: '', providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuxiliaryBooksHistorialComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('warns and skips load when no enterprise is selected', () => {
    enterpriseService.getSelectedEnterprise.and.returnValue(null as any);
    component.ngOnInit();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'warn' }),
    );
    expect(auxiliaryBookService.getHistoryByEnterprise).not.toHaveBeenCalled();
  });

  it('loadHistory maps response into history rows', () => {
    auxiliaryBookService.getHistoryByEnterprise.and.returnValue(
      of(
        buildPage(
          [
            {
              id: '1',
              state: 'COMPLETED',
              auxiliaryBook: {
                publicId: 'pub-1',
                type: 'DIARY',
                createdAt: '2025-01-01',
                userId: 'u1',
              },
            },
          ],
          1,
        ),
      ),
    );

    component.ngOnInit();
    expect(component.history.length).toBe(1);
    expect(component.history[0].publicId).toBe('pub-1');
    expect(component.totalRecords).toBe(1);
    expect(component.isLoading).toBeFalse();
  });

  it('loadHistory handles malformed response', () => {
    auxiliaryBookService.getHistoryByEnterprise.and.returnValue(of({} as any));
    component.ngOnInit();
    expect(component.history).toEqual([]);
    expect(messageService.add).toHaveBeenCalled();
  });

  it('loadHistory handles error', () => {
    auxiliaryBookService.getHistoryByEnterprise.and.returnValue(
      throwError(() => new Error('boom')),
    );
    component.ngOnInit();
    expect(component.history).toEqual([]);
    expect(component.totalRecords).toBe(0);
    expect(component.isLoading).toBeFalse();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
  });

  it('loadHistory updates pagination from event', () => {
    auxiliaryBookService.getHistoryByEnterprise.and.returnValue(of(buildPage()));
    (component as any).enterpriseId = 'ent-1';
    component.loadHistory({
      first: 20,
      rows: 10,
      sortField: 'auxiliaryBook.type',
      sortOrder: 1,
    });
    expect(component.first).toBe(20);
    expect(component.sortField).toBe('auxiliaryBook.type');
    expect(component.sortOrder).toBe('asc');
  });

  describe('getStatusSeverity', () => {
    it('maps COMPLETED to success', () => {
      expect(component.getStatusSeverity('COMPLETED')).toBe('success');
    });
    it('maps ERROR to danger', () => {
      expect(component.getStatusSeverity('ERROR')).toBe('danger');
    });
    it('maps GENERATING to info', () => {
      expect(component.getStatusSeverity('GENERATING')).toBe('info');
    });
    it('falls back to warning', () => {
      expect(component.getStatusSeverity('UNKNOWN')).toBe('warning');
    });
  });

  it('showDetails navigates with publicId', () => {
    component.showDetails({ publicId: 'pub-1' });
    expect(router.navigate).toHaveBeenCalledWith([
      '/financial/reports/auxiliary-books/historial/details',
      'pub-1',
    ]);
  });

  it('showSchedulingDialog opens dialog with selected item', () => {
    const item = { publicId: 'pub-1' };
    component.showSchedulingDialog(item);
    expect(component.selectedHistoryItem).toBe(item);
    expect(dialogService.open).toHaveBeenCalled();
  });

  it('integration: applyGlobalFilter resets paginator and reloads', () => {
    auxiliaryBookService.getHistoryByEnterprise.and.returnValue(of(buildPage()));
    (component as any).enterpriseId = 'ent-1';
    component.dt = { first: 5 } as any;
    const evt = { target: { value: 'foo' } } as unknown as Event;
    component.applyGlobalFilter(evt);
    expect(component.searchValue).toBe('foo');
    expect(component.dt.first).toBe(0);
    expect(auxiliaryBookService.getHistoryByEnterprise).toHaveBeenCalled();
  });
});
