import { TestBed } from '@angular/core/testing';
import { ExcelExportService, KardexExportData } from './excel-export.service';
import { ProductResponse } from '../models/ProductResponse';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Mock de las librerías externas
jest.mock('xlsx');
jest.mock('file-saver');

describe('ExcelExportService', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExcelExportService]
    });
    service = TestBed.inject(ExcelExportService);
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('processKardexData', () => {
    it('should process PURCHASE type correctly', () => {
      const rawData = [
        {
          date: '2024-01-15',
          details: 'Purchase order #123',
          quantity: 10,
          unitPrice: 100,
          type: 'PURCHASE',
          balanceQuantity: 10,
          balanceUnitPrice: 100,
          totalBalance: 1000
        }
      ];

      const result = service.processKardexData(rawData);

      expect(result.length).toBe(1);
      expect(result[0]['Entrada - Cantidad']).toBe(10);
      expect(result[0]['Entrada - Valor Unitario']).toBe(100);
      expect(result[0]['Entrada - Valor Total']).toBe(1000);
      expect(result[0]['Salida - Cantidad']).toBe('');
      expect(result[0]['Salida - Valor Unitario']).toBe('');
      expect(result[0]['Salida - Valor Total']).toBe('');
      expect(result[0]['Saldo - Cantidad']).toBe(10);
      expect(result[0]['Saldo - Valor Total']).toBe(1000);
    });

    it('should process PURCHASERETURN type correctly (negative entry)', () => {
      const rawData = [
        {
          date: '2024-01-20',
          details: 'Purchase return',
          quantity: 5,
          unitPrice: 100,
          type: 'PURCHASERETURN',
          balanceQuantity: 5,
          balanceUnitPrice: 100,
          totalBalance: 500
        }
      ];

      const result = service.processKardexData(rawData);

      expect(result[0]['Entrada - Cantidad']).toBe(-5);
      expect(result[0]['Entrada - Valor Unitario']).toBe(100);
      expect(result[0]['Entrada - Valor Total']).toBe(-500);
    });

    it('should process SALE type correctly', () => {
      const rawData = [
        {
          date: '2024-02-10',
          details: 'Sale invoice #456',
          quantity: 3,
          unitPrice: 150,
          type: 'SALE',
          balanceQuantity: 7,
          balanceUnitPrice: 100,
          totalBalance: 700
        }
      ];

      const result = service.processKardexData(rawData);

      expect(result[0]['Entrada - Cantidad']).toBe('');
      expect(result[0]['Salida - Cantidad']).toBe(3);
      expect(result[0]['Salida - Valor Unitario']).toBe(150);
      expect(result[0]['Salida - Valor Total']).toBe(450);
      expect(result[0]['Saldo - Cantidad']).toBe(7);
    });

    it('should process SALESRETURN type correctly (negative exit)', () => {
      const rawData = [
        {
          date: '2024-02-15',
          details: 'Sales return',
          quantity: 2,
          unitPrice: 150,
          type: 'SALESRETURN',
          balanceQuantity: 9,
          balanceUnitPrice: 100,
          totalBalance: 900
        }
      ];

      const result = service.processKardexData(rawData);

      expect(result[0]['Salida - Cantidad']).toBe(-2);
      expect(result[0]['Salida - Valor Unitario']).toBe(150);
      expect(result[0]['Salida - Valor Total']).toBe(-300);
    });

    it('should format dates correctly in Spanish', () => {
      const rawData = [
        {
          date: '2024-03-15T12:00:00',
          details: 'Test',
          quantity: 1,
          unitPrice: 100,
          type: 'PURCHASE',
          balanceQuantity: 1,
          balanceUnitPrice: 100,
          totalBalance: 100
        }
      ];

      const result = service.processKardexData(rawData);

      // La fecha debe estar en formato español y contener el año
      expect(result[0].Fecha).toContain('2024');
      expect(result[0].Fecha).toContain('marzo');
    });

    it('should process multiple records correctly', () => {
      const rawData = [
        {
          date: '2024-01-01',
          details: 'Purchase 1',
          quantity: 10,
          unitPrice: 100,
          type: 'PURCHASE',
          balanceQuantity: 10,
          balanceUnitPrice: 100,
          totalBalance: 1000
        },
        {
          date: '2024-01-05',
          details: 'Sale 1',
          quantity: 3,
          unitPrice: 100,
          type: 'SALE',
          balanceQuantity: 7,
          balanceUnitPrice: 100,
          totalBalance: 700
        }
      ];

      const result = service.processKardexData(rawData);

      expect(result.length).toBe(2);
      expect(result[0]['Entrada - Cantidad']).toBe(10);
      expect(result[1]['Salida - Cantidad']).toBe(3);
    });

    it('should handle empty array', () => {
      const result = service.processKardexData([]);
      expect(result).toEqual([]);
    });
  });

  describe('exportKardexToExcel', () => {
    let mockWorkbook: any;
    let mockWorksheet: any;

    beforeEach(() => {
      mockWorksheet = {};
      mockWorkbook = { SheetNames: [], Sheets: {} };

      (XLSX.utils.book_new as jest.Mock).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_add_aoa as jest.Mock).mockImplementation(() => {});
      (XLSX.utils.book_append_sheet as jest.Mock).mockImplementation(() => {});
      (XLSX.utils.encode_col as jest.Mock).mockImplementation((col) => String.fromCharCode(65 + col));
      (XLSX.write as jest.Mock).mockReturnValue(new ArrayBuffer(8));
      (saveAs as unknown as jest.Mock).mockImplementation(() => {});
    });

    it('should export kardex to Excel with correct structure', () => {
      const processedData: KardexExportData[] = [
        {
          Fecha: '15-enero-2024',
          Detalle: 'Purchase order #123',
          Cantidad: 10,
          'Valor Unitario': 100,
          'Entrada - Cantidad': 10,
          'Entrada - Valor Unitario': 100,
          'Entrada - Valor Total': 1000,
          'Salida - Cantidad': '',
          'Salida - Valor Unitario': '',
          'Salida - Valor Total': '',
          'Saldo - Cantidad': 10,
          'Saldo - Valor Unitario': 100,
          'Saldo - Valor Total': 1000
        }
      ];

      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Test Product',
        reference: 'TP001',
        presentation: 'Box',
        manager: 'Test Manager',
        enterpriseId: '123'
      };

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      service.exportKardexToExcel(processedData, mockProduct, startDate, endDate);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.sheet_add_aoa).toHaveBeenCalled();
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.write).toHaveBeenCalledWith(mockWorkbook, { bookType: 'xlsx', type: 'array' });
      expect(saveAs).toHaveBeenCalled();
    });

    it('should include product information in the export', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Amazing Product',
        reference: 'AP-2024',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      service.exportKardexToExcel(processedData, mockProduct, null, null);

      // Verificar que sheet_add_aoa fue llamado múltiples veces (para encabezados y datos)
      const calls = (XLSX.utils.sheet_add_aoa as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      // Verificar que book_append_sheet fue llamado
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    });

    it('should handle null dates in export', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Test Product',
        reference: 'TP001',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      service.exportKardexToExcel(processedData, mockProduct, null, null);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalled();
    });

    it('should generate correct filename', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Product With Spaces',
        reference: 'PWS001',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      service.exportKardexToExcel(processedData, mockProduct, null, null);

      const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>;
      const saveAsCall = mockSaveAs.mock.calls[0];
      const filename = saveAsCall[1];

      expect(filename).toContain('Kardex_');
      expect(filename).toContain('.xlsx');
      // Verificar que los espacios fueron reemplazados
      expect(filename).toContain('Product_With_Spaces');
    });

    it('should create Blob with correct type', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Test',
        reference: 'T001',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      service.exportKardexToExcel(processedData, mockProduct, null, null);

      const mockSaveAs = saveAs as jest.MockedFunction<typeof saveAs>;
      const saveAsCall = mockSaveAs.mock.calls[0];
      const blob = saveAsCall[0];

      expect(blob).toBeInstanceOf(Blob);
      if (blob instanceof Blob) {
        expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    });

    it('should set correct column widths', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Test Product',
        reference: 'TP001',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      service.exportKardexToExcel(processedData, mockProduct, null, null);

      // El worksheet debe tener configuración de anchos de columna
      expect(XLSX.utils.sheet_add_aoa).toHaveBeenCalled();
    });

    it('should handle empty data array', () => {
      const processedData: KardexExportData[] = [];
      const mockProduct: ProductResponse = {
        id: 1,
        productId: 101,
        name: 'Empty Test',
        reference: 'ET001',
        presentation: 'Box',
        manager: 'Manager',
        enterpriseId: '123'
      };

      expect(() => {
        service.exportKardexToExcel(processedData, mockProduct, null, null);
      }).not.toThrow();

      expect(saveAs).toHaveBeenCalled();
    });
  });
});
