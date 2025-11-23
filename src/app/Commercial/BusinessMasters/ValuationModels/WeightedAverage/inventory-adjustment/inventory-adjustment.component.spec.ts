import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { InventoryAdjustmentComponent } from './inventory-adjustment.component';
import { KardexService } from '../services/kardex.service';
import { ProductResponse } from '../models/ProductResponse';
import { KardexRow } from '../models/KardexRow';

describe('InventoryAdjustmentComponent - Integration Tests', () => {
  let component: InventoryAdjustmentComponent;
  let fixture: ComponentFixture<InventoryAdjustmentComponent>;
  let kardexService: jest.Mocked<KardexService>;
  let messageService: jest.Mocked<MessageService>;

  const mockProductData: ProductResponse = {
    id: 1,
    productId: 1,
    name: 'Producto Test',
    reference: 'REF-001',
    presentation: 'Unidad',
    enterpriseId: '1',
    manager: 'Test Manager'
  };

  const mockLastKardexRecord: KardexRow = {
    date: '2025-01-01',
    details: 'Registro anterior',
    quantity: 100,
    unitPrice: 1000,
    type: 'PURCHASE',
    balanceQuantity: 100,
    balanceUnitPrice: 1000,
    totalBalance: 100000,
    formattedDate: '01-enero-2025'
  };

  beforeEach(async () => {
    const kardexServiceMock = {
      purchaseAdjustment: jest.fn(),
      saleAdjustment: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        InventoryAdjustmentComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        provideNoopAnimations(),
        { provide: KardexService, useValue: kardexServiceMock }
      ]
    }).compileComponents();

    kardexService = TestBed.inject(KardexService) as jest.Mocked<KardexService>;

    fixture = TestBed.createComponent(InventoryAdjustmentComponent);
    component = fixture.componentInstance;
    
    // Obtener el MessageService del componente (no del TestBed)
    messageService = fixture.debugElement.injector.get(MessageService) as jest.Mocked<MessageService>;
    jest.spyOn(messageService, 'add');
    
    component.productData = mockProductData;
    component.lastKardexRecord = mockLastKardexRecord;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.adjustmentForm).toBeDefined();
      expect(component.adjustmentForm.get('adjustmentType')?.value).toBe('');
      expect(component.adjustmentForm.get('quantity')?.value).toBeNull();
      expect(component.adjustmentForm.get('unitPrice')?.value).toBeNull();
      expect(component.adjustmentForm.get('details')?.value).toBe('');
      expect(component.adjustmentForm.get('date')?.value).toBeNull();
    });

    it('should set validators correctly for purchase adjustment', () => {
      component.adjustmentForm.patchValue({ adjustmentType: 'purchase' });

      const unitPriceControl = component.adjustmentForm.get('unitPrice');
      expect(unitPriceControl?.enabled).toBe(true);
      expect(unitPriceControl?.hasError('required')).toBe(true);
    });

    it('should disable unitPrice for sale adjustment', () => {
      component.adjustmentForm.patchValue({ adjustmentType: 'sale' });

      const unitPriceControl = component.adjustmentForm.get('unitPrice');
      expect(unitPriceControl?.disabled).toBe(true);
    });
  });

  describe('Date Limits', () => {
    it('should set minDate from lastKardexRecord', () => {
      component.ngOnInit();

      expect(component.minDate).toEqual(new Date(mockLastKardexRecord.date));
    });

    it('should set minDate to null when no lastKardexRecord', () => {
      component.lastKardexRecord = null;
      component.ngOnInit();

      expect(component.minDate).toBeNull();
    });

    it('should set maxDate to current date', () => {
      component.ngOnInit();

      const today = new Date();
      expect(component.maxDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('Purchase Adjustment Preview', () => {
    it('should calculate weighted average preview correctly', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200
      });

      component.updatePreview();

      expect(component.showPreview).toBe(true);
      expect(component.previewResult).toBeDefined();
      expect(component.previewResult.type).toBe('purchase');
      expect(component.previewResult.newQuantity).toBe(150); // 100 + 50
      expect(component.previewResult.addedQuantity).toBe(50);
      expect(component.previewResult.addedUnitPrice).toBe(1200);
      expect(component.previewResult.newUnitPrice).toBeCloseTo(1066.67, 2); // (100*1000 + 50*1200)/150
    });

    it('should not show preview without required fields', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50
      });

      component.updatePreview();

      expect(component.showPreview).toBe(false);
    });
  });

  describe('Sale Adjustment Preview', () => {
    it('should calculate sale preview correctly', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 30
      });

      component.updatePreview();

      expect(component.showPreview).toBe(true);
      expect(component.previewResult).toBeDefined();
      expect(component.previewResult.type).toBe('sale');
      expect(component.previewResult.newQuantity).toBe(70); // 100 - 30
      expect(component.previewResult.soldQuantity).toBe(30);
      expect(component.previewResult.newUnitPrice).toBe(1000); // Mantiene el precio
    });

    it('should not allow negative inventory', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 150
      });

      expect(component.canSubmitSale()).toBe(false);
    });
  });

  describe('Purchase Adjustment Submission', () => {
    it('should successfully submit purchase adjustment', fakeAsync(() => {
      const mockResponse = { data: { success: true }, status: 200, message: 'OK' };
      kardexService.purchaseAdjustment.mockReturnValue(of(mockResponse));

      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200,
        details: 'Test purchase'
      });

      jest.spyOn(component.adjustmentCompleted, 'emit');

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(kardexService.purchaseAdjustment).toHaveBeenCalledWith({
        quantity: 50,
        unitPrice: 1200,
        details: 'Test purchase',
        productId: 1
      });
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Éxito'
        })
      );
      expect(component.adjustmentCompleted.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    }));

    it('should submit purchase adjustment with date', fakeAsync(() => {
      const mockResponse = { data: { success: true }, status: 200, message: 'OK' };
      kardexService.purchaseAdjustment.mockReturnValue(of(mockResponse));

      const testDate = new Date('2025-01-15');
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200,
        date: testDate
      });

      component.onSubmit();
      tick();

      expect(kardexService.purchaseAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({
          date: testDate.toISOString()
        })
      );
    }));

    it('should handle purchase adjustment error', fakeAsync(() => {
      const mockError = { error: { message: 'Error en la compra' } };
      kardexService.purchaseAdjustment.mockReturnValue(throwError(() => mockError));

      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200
      });

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Error en la compra'
        })
      );
      expect(component.isSubmitting).toBe(false);
    }));
  });

  describe('Sale Adjustment Submission', () => {
    it('should successfully submit sale adjustment', fakeAsync(() => {
      const mockResponse = { data: { success: true }, status: 200, message: 'OK' };
      kardexService.saleAdjustment.mockReturnValue(of(mockResponse));

      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 30,
        details: 'Test sale'
      });

      jest.spyOn(component.adjustmentCompleted, 'emit');

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(kardexService.saleAdjustment).toHaveBeenCalledWith({
        quantity: 30,
        details: 'Test sale',
        productId: 1
      });
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          summary: 'Éxito'
        })
      );
      expect(component.adjustmentCompleted.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBe(false);
    }));

    it('should submit sale adjustment with date', fakeAsync(() => {
      const mockResponse = { data: { success: true }, status: 200, message: 'OK' };
      kardexService.saleAdjustment.mockReturnValue(of(mockResponse));

      const testDate = new Date('2025-01-15');
      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 30,
        date: testDate
      });

      component.onSubmit();
      tick();

      expect(kardexService.saleAdjustment).toHaveBeenCalledWith(
        expect.objectContaining({
          date: testDate.toISOString()
        })
      );
    }));

    it('should handle sale adjustment error', fakeAsync(() => {
      const mockError = { error: { message: 'Error en la venta' } };
      kardexService.saleAdjustment.mockReturnValue(throwError(() => mockError));

      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 30
      });

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'error',
          detail: 'Error en la venta'
        })
      );
      expect(component.isSubmitting).toBe(false);
    }));
  });

  describe('Form Validation', () => {
    it('should validate form for purchase adjustment', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200
      });

      expect(component.isFormValid()).toBe(true);
    });

    it('should validate form for sale adjustment', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 30
      });

      expect(component.isFormValid()).toBe(true);
    });

    it('should invalidate form when quantity exceeds available stock', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'sale',
        quantity: 150 // Más de lo disponible (100)
      });

      expect(component.isFormValid()).toBe(false);
    });

    it('should prevent submission while processing', () => {
      component.isSubmitting = true;
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200
      });

      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('Dialog Management', () => {
    it('should reset form on dialog hide', () => {
      component.adjustmentForm.patchValue({
        adjustmentType: 'purchase',
        quantity: 50,
        unitPrice: 1200
      });
      component.showPreview = true;

      jest.spyOn(component.dialogClosed, 'emit');

      component.onDialogHide();

      expect(component.adjustmentForm.get('adjustmentType')?.value).toBeFalsy();
      expect(component.showPreview).toBe(false);
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });
  });

  describe('OnChanges Lifecycle', () => {
    it('should update date limits when lastKardexRecord changes', () => {
      const newKardexRecord: KardexRow = {
        ...mockLastKardexRecord,
        date: '2025-02-01'
      };

      // Actualizar el lastKardexRecord del componente antes de llamar a ngOnChanges
      component.lastKardexRecord = newKardexRecord;

      component.ngOnChanges({
        lastKardexRecord: {
          currentValue: newKardexRecord,
          previousValue: mockLastKardexRecord,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.minDate).toEqual(new Date('2025-02-01'));
    });
  });

  describe('Helper Methods', () => {
    it('should return max sale quantity', () => {
      expect(component.getMaxSaleQuantity()).toBe(100);
    });

    it('should return 0 for max sale quantity without records', () => {
      component.lastKardexRecord = null;
      expect(component.getMaxSaleQuantity()).toBe(0);
    });

    it('should check if sale can be submitted', () => {
      component.adjustmentForm.patchValue({
        quantity: 50
      });
      expect(component.canSubmitSale()).toBe(true);

      component.adjustmentForm.patchValue({
        quantity: 150
      });
      expect(component.canSubmitSale()).toBe(false);
    });
  });
});
