import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

import { ExportAuxiliaryBookComponent } from './export-auxiliary-book.component';
import { AuxiliaryBooksServiceService } from '../../Services/auxiliary-books-service.service';

describe('ExportAuxiliaryBookComponent', () => {
  let component: ExportAuxiliaryBookComponent;
  let fixture: ComponentFixture<ExportAuxiliaryBookComponent>;
  let auxiliaryBookService: jasmine.SpyObj<AuxiliaryBooksServiceService>;
  let dialogRef: jasmine.SpyObj<DynamicDialogRef>;
  let messageService: jasmine.SpyObj<MessageService>;

  const setup = async (configData: any = {}) => {
    auxiliaryBookService = jasmine.createSpyObj('AuxiliaryBooksServiceService', [
      'exportAuxiliaryBook',
    ]);
    dialogRef = jasmine.createSpyObj('DynamicDialogRef', ['close']);
    messageService = jasmine.createSpyObj('MessageService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ExportAuxiliaryBookComponent],
      providers: [
        { provide: AuxiliaryBooksServiceService, useValue: auxiliaryBookService },
        { provide: DynamicDialogRef, useValue: dialogRef },
        { provide: DynamicDialogConfig, useValue: { data: configData } },
        { provide: MessageService, useValue: messageService },
      ],
    })
      .overrideComponent(ExportAuxiliaryBookComponent, {
        set: { template: '', providers: [] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ExportAuxiliaryBookComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
  };

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('ngOnInit copies config data into component state', async () => {
    await setup({
      reportTitle: 'Mi Reporte',
      headerConfig: [[{ header: 'X', field: 'x' }]],
      dataTable: [{ x: 1 }],
      enterpriseData: { id: 'ent-1', name: 'Acme', logo: 'logo.png' },
      generationDate: new Date('2025-01-01'),
      totals: { totalDebit: 100 },
      auxiliaryBook: {
        criteria: {
          criteriaType: 'ACCOUNT',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          thirdPartyId: 9,
          criteriaRange: { fromRange: 1, toRange: 5 },
        },
      },
      thirdPartyInfo: { name: 'Foo', typeId: 'CC' },
    });
    expect(component.reportTitle).toBe('Mi Reporte');
    expect(component.previewData.length).toBe(1);
    expect(component.totals.totalDebit).toBe(100);
    const keys = component.criteriaForPreview.map((c) => c.key);
    expect(keys).toContain('Tipo de Nivel');
    expect(keys).toContain('Rango de Cuentas');
    expect(keys).toContain('Tercero');
    expect(keys).toContain('Fecha de Inicio');
  });

  it('updateStyles merges into existing styles', async () => {
    await setup();
    component.updateStyles({ font: 'Roboto', fontSize: 14 });
    expect(component.styles.font).toBe('Roboto');
    expect(component.styles.fontSize).toBe(14);
    expect(component.styles.align).toBe('left');
  });

  it('exportReport rejects when auxiliaryBook is missing', async () => {
    await setup({});
    component.exportReport();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
    expect(auxiliaryBookService.exportAuxiliaryBook).not.toHaveBeenCalled();
  });

  it('exportReport triggers download on success', async () => {
    await setup({
      auxiliaryBook: { criteria: {} },
      reportTitle: 'My Report',
      enterpriseData: { name: 'Acme', logo: 'logo.png' },
      dataTable: [],
    });
    const blob = new Blob(['x']);
    auxiliaryBookService.exportAuxiliaryBook.and.returnValue(of(blob));
    spyOn(globalThis.URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(globalThis.URL, 'revokeObjectURL');
    const anchor = document.createElement('a');
    spyOn(anchor, 'click');
    spyOn(document, 'createElement').and.returnValue(anchor);
    spyOn(document.body, 'appendChild').and.returnValue(anchor);

    component.exportReport();

    expect(auxiliaryBookService.exportAuxiliaryBook).toHaveBeenCalled();
    expect(anchor.click).toHaveBeenCalled();
    expect(dialogRef.close).toHaveBeenCalled();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'success' }),
    );
  });

  it('exportReport shows error toast on failure', async () => {
    await setup({ auxiliaryBook: { criteria: {} } });
    auxiliaryBookService.exportAuxiliaryBook.and.returnValue(
      throwError(() => new Error('boom')),
    );
    component.exportReport();
    expect(messageService.add).toHaveBeenCalledWith(
      jasmine.objectContaining({ severity: 'error' }),
    );
  });

  it('closeModal closes the dialog with null', async () => {
    await setup();
    component.closeModal();
    expect(dialogRef.close).toHaveBeenCalledWith(null);
  });
});
