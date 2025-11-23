import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ListKardexWeightedAverageComponent } from './list-kardex-weighted-average.component';
import { KardexService } from '../services/kardex.service';
import { ProductService } from '../services/product.service';
import { ExcelExportService } from '../services/excel-export.service';
import { ProductResponse } from '../models/ProductResponse';
import { KardexRow } from '../models/KardexRow';

describe('ListKardexWeightedAverageComponent - Integration Tests', () => {
  let component: ListKardexWeightedAverageComponent;
  let fixture: ComponentFixture<ListKardexWeightedAverageComponent>;
  let kardexService: jest.Mocked<KardexService>;
  let productService: jest.Mocked<ProductService>;
  let messageService: jest.Mocked<MessageService>;
  let excelExportService: jest.Mocked<ExcelExportService>;

  const mockProducts: ProductResponse[] = [
    {
      id: 1,
      productId: 1,
      name: 'Producto 1',
      reference: 'REF-001',
      presentation: 'Unidad',
      enterpriseId: '1',
      manager: 'Manager 1'
    },
    {
      id: 2,
      productId: 2,
      name: 'Producto 2',
      reference: 'REF-002',
      presentation: 'Caja',
      enterpriseId: '2',
      manager: 'Manager 2'
    }
  ];

  const mockKardexData = {
    status: 200,
    message: 'OK',
    data: {
      content: [
        {
          kardexId: 1,
          date: new Date('2025-01-01'),
          details: 'Compra inicial',
          quantity: 100,
          unitPrice: 1000,
          type: 'PURCHASE',
          balanceQuantity: 100,
          balanceUnitPrice: 1000,
          totalBalance: 100000
        },
        {
          kardexId: 2,
          date: new Date('2025-01-15'),
          details: 'Venta',
          quantity: 30,
          unitPrice: 1000,
          type: 'SALE',
          balanceQuantity: 70,
          balanceUnitPrice: 1000,
          totalBalance: 70000
        }
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 5
    }
  };

  const mockLatestKardex = {
    status: 200,
    message: 'OK',
    data: {
      kardexId: 2,
      date: new Date('2025-01-15'),
      details: 'Venta',
      quantity: 30,
      unitPrice: 1000,
      type: 'SALE',
      balanceQuantity: 70,
      balanceUnitPrice: 1000,
      totalBalance: 70000
    }
  };

  beforeEach(async () => {
    const kardexServiceMock = {
      getKardexByProductId: jest.fn(),
      getLatestKardexByProductId: jest.fn(),
      getAllKardexForExport: jest.fn()
    };
    const productServiceMock = {
      getAllProducts: jest.fn()
    };
    const messageServiceMock = {
      add: jest.fn()
    };
    const excelExportServiceMock = {
      processKardexData: jest.fn(),
      exportKardexToExcel: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        ListKardexWeightedAverageComponent,
        HttpClientTestingModule,
        FormsModule
      ],
      providers: [
        { provide: KardexService, useValue: kardexServiceMock },
        { provide: ProductService, useValue: productServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: ExcelExportService, useValue: excelExportServiceMock }
      ]
    }).compileComponents();

    kardexService = TestBed.inject(KardexService) as jest.Mocked<KardexService>;
    productService = TestBed.inject(ProductService) as jest.Mocked<ProductService>;
    messageService = TestBed.inject(MessageService) as jest.Mocked<MessageService>;
    excelExportService = TestBed.inject(ExcelExportService) as jest.Mocked<ExcelExportService>;

    productService.getAllProducts.mockReturnValue(of({ data: mockProducts, status: 200, message: 'OK' }));

    fixture = TestBed.createComponent(ListKardexWeightedAverageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load all products on init', () => {
      fixture.detectChanges();

      expect(productService.getAllProducts).toHaveBeenCalled();
      expect(component.allProducts).toEqual(mockProducts);
    });

    it('should initialize with empty kardex list', () => {
      fixture.detectChanges();

      expect(component.kardexList).toEqual([]);
      expect(component.totalRecords).toBe(0);
    });

    it('should initialize with productId as 0', () => {
      fixture.detectChanges();

      expect(component.productId).toBe(0);
    });
  });

  describe('Product Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));
    });

    it('should set selected product and load kardex', () => {
      component.onProductSelect(mockProducts[0]);

      expect(component.selectedProduct).toEqual(mockProducts[0]);
      expect(component.productId).toBe(1);
      expect(kardexService.getKardexByProductId).toHaveBeenCalled();
    });

    it('should filter products correctly', () => {
      const event = { originalEvent: new Event('input'), query: 'producto 1' };
      component.allProducts = mockProducts;

      component.filterProducts(event);

      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].name).toBe('Producto 1');
    });

    it('should filter products case-insensitively', () => {
      const event = { originalEvent: new Event('input'), query: 'PRODUCTO' };
      component.allProducts = mockProducts;

      component.filterProducts(event);

      expect(component.filteredProducts.length).toBe(2);
    });
  });

  describe('Kardex Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedProduct = mockProducts[0];
      component.productId = 1;
    });

    it('should load kardex data with pagination', (done) => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        expect(kardexService.getKardexByProductId).toHaveBeenCalledWith(1, 0, 5, '', null, null);
        expect(component.kardexList.length).toBe(2);
        expect(component.totalRecords).toBe(2);
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should process purchase entries correctly', (done) => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        const purchaseEntry = component.kardexList[0];
        expect(purchaseEntry.entryQuantity).toBe(100);
        expect(purchaseEntry.entryUnitPrice).toBe(1000);
        expect(purchaseEntry.entryTotal).toBe(100000);
        done();
      }, 100);
    });

    it('should process sale exits correctly', (done) => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        const saleEntry = component.kardexList[1];
        expect(saleEntry.exitQuantity).toBe(30);
        expect(saleEntry.exitUnitPrice).toBe(1000);
        expect(saleEntry.exitTotal).toBe(30000);
        done();
      }, 100);
    });

    it('should not load kardex when productId is 0', () => {
      component.productId = 0;

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      expect(kardexService.getKardexByProductId).not.toHaveBeenCalled();
      expect(component.kardexList).toEqual([]);
    });

    it('should load kardex with date filters', (done) => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));

      component.startDate = new Date('2025-01-01');
      component.endDate = new Date('2025-01-31');

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        expect(kardexService.getKardexByProductId).toHaveBeenCalledWith(
          1,
          0,
          5,
          '',
          component.startDate,
          component.endDate
        );
        done();
      }, 100);
    });

    it('should format dates correctly', (done) => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        expect(component.kardexList[0].formattedDate).toBeDefined();
        expect(component.kardexList[0].formattedDate).toContain('enero');
        done();
      }, 100);
    });
  });

  describe('Date Range Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedProduct = mockProducts[0];
      component.productId = 1;
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));
    });

    it('should clear endDate if it is before startDate', () => {
      component.startDate = new Date('2025-01-15');
      component.endDate = new Date('2025-01-10');

      component.onStartDateChange();

      expect(component.endDate).toBeNull();
    });

    it('should reload kardex when both dates are set', () => {
      component.startDate = new Date('2025-01-01');
      component.endDate = new Date('2025-01-31');

      component.onStartDateChange();

      expect(kardexService.getKardexByProductId).toHaveBeenCalled();
    });

    it('should not reload kardex when only startDate is set', () => {
      component.startDate = new Date('2025-01-01');
      component.endDate = null;

      component.onStartDateChange();

      expect(kardexService.getKardexByProductId).not.toHaveBeenCalled();
    });

    it('should handle endDate change correctly', () => {
      component.startDate = new Date('2025-01-01');
      component.endDate = new Date('2025-01-31');

      component.onEndDateChange();

      expect(kardexService.getKardexByProductId).toHaveBeenCalled();
    });
  });

  describe('Inventory Adjustment', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedProduct = mockProducts[0];
      component.productId = 1;
    });

    it('should enable inventory adjustment when product is selected', () => {
      expect(component.isInventoryAdjustmentEnabled()).toBe(true);
    });

    it('should disable inventory adjustment when no product selected', () => {
      component.selectedProduct = undefined;
      component.productId = 0;

      expect(component.isInventoryAdjustmentEnabled()).toBe(false);
    });

    it('should open inventory adjustment dialog', (done) => {
      kardexService.getLatestKardexByProductId.mockReturnValue(of(mockLatestKardex));

      component.openInventoryAdjustment();

      setTimeout(() => {
        expect(kardexService.getLatestKardexByProductId).toHaveBeenCalledWith(1);
        expect(component.showInventoryAdjustment).toBe(true);
        expect(component.lastKardexRecord).toBeDefined();
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should handle error when opening inventory adjustment', (done) => {
      kardexService.getLatestKardexByProductId.mockReturnValue(
        throwError(() => new Error('Error al obtener datos'))
      );

      component.openInventoryAdjustment();

      setTimeout(() => {
        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'No se pudo obtener el último registro del kardex'
          })
        );
        expect(component.loading).toBe(false);
        done();
      }, 100);
    });

    it('should handle adjustment completion', () => {
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));
      component.first = 0;

      component.onAdjustmentCompleted();

      expect(component.showInventoryAdjustment).toBe(false);
      expect(kardexService.getKardexByProductId).toHaveBeenCalled();
      expect(messageService.add).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: 'success',
          detail: expect.stringContaining('actualizado')
        })
      );
    });

    it('should handle dialog close', () => {
      component.onAdjustmentDialogClosed();

      expect(component.showInventoryAdjustment).toBe(false);
    });

    it('should process latest kardex record with PURCHASE type', (done) => {
      const purchaseRecord = {
        status: 200,
        message: 'OK',
        data: {
          ...mockLatestKardex.data,
          type: 'PURCHASE',
          quantity: 50,
          unitPrice: 1200
        }
      };
      kardexService.getLatestKardexByProductId.mockReturnValue(of(purchaseRecord));

      component.openInventoryAdjustment();

      setTimeout(() => {
        expect(component.lastKardexRecord?.entryQuantity).toBe(50);
        expect(component.lastKardexRecord?.entryUnitPrice).toBe(1200);
        done();
      }, 100);
    });
  });

  describe('Excel Export', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedProduct = mockProducts[0];
      component.productId = 1;
    });

    it('should export kardex to Excel successfully', (done) => {
      kardexService.getAllKardexForExport.mockReturnValue(of(mockKardexData));
      excelExportService.processKardexData.mockReturnValue([]);
      excelExportService.exportKardexToExcel.mockImplementation(() => {});

      component.exportToExcel();

      setTimeout(() => {
        expect(kardexService.getAllKardexForExport).toHaveBeenCalledWith(1, null, null);
        expect(excelExportService.processKardexData).toHaveBeenCalled();
        expect(excelExportService.exportKardexToExcel).toHaveBeenCalled();
        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            detail: 'Archivo Excel exportado correctamente'
          })
        );
        expect(component.exportLoading).toBe(false);
        done();
      }, 100);
    });

    it('should export with date range', (done) => {
      kardexService.getAllKardexForExport.mockReturnValue(of(mockKardexData));
      excelExportService.processKardexData.mockReturnValue([]);
      excelExportService.exportKardexToExcel.mockImplementation(() => {});

      component.startDate = new Date('2025-01-01');
      component.endDate = new Date('2025-01-31');

      component.exportToExcel();

      setTimeout(() => {
        expect(kardexService.getAllKardexForExport).toHaveBeenCalledWith(
          1,
          component.startDate,
          component.endDate
        );
        done();
      }, 100);
    });

    it('should handle export error', (done) => {
      kardexService.getAllKardexForExport.mockReturnValue(
        throwError(() => new Error('Error al exportar'))
      );

      component.exportToExcel();

      setTimeout(() => {
        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Error al obtener los datos para exportar'
          })
        );
        expect(component.exportLoading).toBe(false);
        done();
      }, 100);
    });

    it('should not export when no product selected', () => {
      component.selectedProduct = undefined;
      component.productId = 0;

      component.exportToExcel();

      expect(kardexService.getAllKardexForExport).not.toHaveBeenCalled();
    });

    it('should handle processing error', (done) => {
      kardexService.getAllKardexForExport.mockReturnValue(of(mockKardexData));
      excelExportService.processKardexData.mockImplementation(() => { throw new Error('Processing error'); });

      component.exportToExcel();

      setTimeout(() => {
        expect(messageService.add).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Error al generar el archivo Excel'
          })
        );
        expect(component.exportLoading).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Purchase Return Processing', () => {
    it('should process purchase return correctly', (done) => {
      const mockDataWithReturn = {
        status: 200,
        message: 'OK',
        data: {
          content: [
            {
              kardexId: 1,
              date: new Date('2025-01-01'),
              details: 'Devolución de compra',
              quantity: 10,
              unitPrice: 1000,
              type: 'PURCHASERETURN',
              balanceQuantity: 90,
              balanceUnitPrice: 1000,
              totalBalance: 90000
            }
          ],
          totalElements: 1,
          totalPages: 1
        }
      };

      kardexService.getKardexByProductId.mockReturnValue(of(mockDataWithReturn));
      component.selectedProduct = mockProducts[0];
      component.productId = 1;

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        const returnEntry = component.kardexList[0];
        expect(returnEntry.entryQuantity).toBe(-10);
        expect(returnEntry.entryTotal).toBe(-10000);
        done();
      }, 100);
    });
  });

  describe('Sales Return Processing', () => {
    it('should process sales return correctly', (done) => {
      const mockDataWithReturn = {
        status: 200,
        message: 'OK',
        data: {
          content: [
            {
              kardexId: 1,
              date: new Date('2025-01-01'),
              details: 'Devolución de venta',
              quantity: 5,
              unitPrice: 1000,
              type: 'SALESRETURN',
              balanceQuantity: 105,
              balanceUnitPrice: 1000,
              totalBalance: 105000
            }
          ],
          totalElements: 1,
          totalPages: 1
        }
      };

      kardexService.getKardexByProductId.mockReturnValue(of(mockDataWithReturn));
      component.selectedProduct = mockProducts[0];
      component.productId = 1;

      const event = { first: 0, rows: 5, sortField: '', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        const returnEntry = component.kardexList[0];
        expect(returnEntry.exitQuantity).toBe(-5);
        expect(returnEntry.exitTotal).toBe(-5000);
        done();
      }, 100);
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.selectedProduct = mockProducts[0];
      component.productId = 1;
      kardexService.getKardexByProductId.mockReturnValue(of(mockKardexData));
    });

    it('should load kardex with ascending sort', (done) => {
      const event = { first: 0, rows: 5, sortField: 'date', sortOrder: 1 };
      component.loadKardex(event);

      setTimeout(() => {
        expect(kardexService.getKardexByProductId).toHaveBeenCalledWith(
          1,
          0,
          5,
          'date,asc',
          null,
          null
        );
        done();
      }, 100);
    });

    it('should load kardex with descending sort', (done) => {
      const event = { first: 0, rows: 5, sortField: 'date', sortOrder: -1 };
      component.loadKardex(event);

      setTimeout(() => {
        expect(kardexService.getKardexByProductId).toHaveBeenCalledWith(
          1,
          0,
          5,
          'date,desc',
          null,
          null
        );
        done();
      }, 100);
    });
  });
});
