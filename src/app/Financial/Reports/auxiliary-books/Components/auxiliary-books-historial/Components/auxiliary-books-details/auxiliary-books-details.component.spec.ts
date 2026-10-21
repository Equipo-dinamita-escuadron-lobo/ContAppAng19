import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DialogService } from 'primeng/dynamicdialog';

import { AuxiliaryBooksDetailsComponent } from './auxiliary-books-details.component';
import { AuxiliaryBooksServiceService } from '../../../../Services/auxiliary-books-service.service';

describe('AuxiliaryBooksDetailsComponent', () => {
  let component: AuxiliaryBooksDetailsComponent;
  let fixture: ComponentFixture<AuxiliaryBooksDetailsComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let router: jasmine.SpyObj<Router>;
  let dialogService: jasmine.SpyObj<DialogService>;

  const setupRoute = (publicId: string | null) => ({
    snapshot: { paramMap: { get: (_: string) => publicId } },
  });

  function configure(publicId: string | null) {
    return TestBed.configureTestingModule({
      imports: [AuxiliaryBooksDetailsComponent],
      providers: [
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: Router, useValue: router },
        { provide: DialogService, useValue: dialogService },
        { provide: ActivatedRoute, useValue: setupRoute(publicId) },
      ],
    })
      .overrideComponent(AuxiliaryBooksDetailsComponent, {
        set: { template: '', providers: [] },
      })
      .compileComponents();
  }

  beforeEach(() => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'getLogsByPublicId',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);
    dialogService = jasmine.createSpyObj('DialogService', ['open']);
  });

  it('should create', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('does not call service when no publicId in route', async () => {
    await configure(null);
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    expect(auxiliaryBookService.getLogsByPublicId).not.toHaveBeenCalled();
  });

  it('loads details and logs from response', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(
      of({
        data: [
          { etypeEvent: 'PENDING', auxiliaryBook: { publicId: 'pub-1' } },
          { etypeEvent: 'SUCCESS', auxiliaryBook: { publicId: 'pub-1' } },
        ],
      } as any),
    );
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    expect(component.bookDetails.publicId).toBe('pub-1');
    expect(component.logs.length).toBe(2);
  });

  it('handles service error', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(
      throwError(() => new Error('boom')),
    );
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
    expect(component.bookDetails).toBeNull();
    expect(component.logs).toEqual([]);
  });

  it('getLastLogStatus returns last log etypeEvent or PENDING fallback', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    expect(component.getLastLogStatus()).toBe('PENDING');
    component.logs = [{ etypeEvent: 'SUCCESS' }];
    expect(component.getLastLogStatus()).toBe('SUCCESS');
  });

  it('getStatusSeverity maps statuses correctly', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    expect(component.getStatusSeverity('SUCCESS')).toBe('success');
    expect(component.getStatusSeverity('GENERATING')).toBe('info');
    expect(component.getStatusSeverity('ERROR')).toBe('danger');
    expect(component.getStatusSeverity(null)).toBe('warning');
  });

  it('goToHistory navigates back to history', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.goToHistory();
    expect(router.navigate).toHaveBeenCalledWith([
      '/financial/reports/auxiliary-books/historial',
    ]);
  });

  it('showSchedulingDialog skips when no bookDetails', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.bookDetails = null;
    component.showSchedulingDialog();
    expect(dialogService.open).not.toHaveBeenCalled();
  });

  it('showSchedulingDialog opens dialog with normalized payload', async () => {
    await configure('pub-1');
    auxiliaryBookService.getLogsByPublicId.and.returnValue(of({ data: [] } as any));
    fixture = TestBed.createComponent(AuxiliaryBooksDetailsComponent);
    component = fixture.componentInstance;
    component.bookDetails = { publicId: 'pub-1', type: 'DIARY' };
    component.logs = [{ etypeEvent: 'SUCCESS' }];
    component.showSchedulingDialog();
    expect(dialogService.open).toHaveBeenCalled();
    const args = dialogService.open.calls.mostRecent().args as any;
    expect(args[1].data.publicId).toBe('pub-1');
    expect(args[1].data.bookName).toBe('DIARY');
    expect(args[1].data.status).toBe('SUCCESS');
  });
});
