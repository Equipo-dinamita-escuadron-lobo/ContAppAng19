import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { KardexService } from './kardex.service';
import { ResponseDto } from '../../models/ResponseDto';
import { KardexPurchaseRequest } from '../models/KardexPurchaseRequest';
import { KardexSaleRequest } from '../models/KardexSaleRequest';
import { environment } from '../../../../../../environments/environment';

describe('KardexService', () => {
  let service: KardexService;
  let httpMock: HttpTestingController;
  const API_URL = environment.API_URL + 'kardex/weighted-average/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [KardexService]
    });

    service = TestBed.inject(KardexService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getKardexByProductId', () => {
    it('should retrieve kardex data with default parameters', () => {
      const productId = 1;
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0
        }
      };

      service.getKardexByProductId(productId, 0, 5, '', null, null).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}kardex-by-product` &&
        request.params.get('productId') === '1' &&
        request.params.get('page') === '0' &&
        request.params.get('size') === '5' &&
        request.params.get('lang') === 'es'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include sort parameter when provided', () => {
      const productId = 1;
      const sort = 'date,desc';
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getKardexByProductId(productId, 0, 5, sort, null, null).subscribe();

      const req = httpMock.expectOne((request) =>
        request.params.get('sort') === sort
      );
      expect(req.request.params.get('sort')).toBe(sort);
      req.flush(mockResponse);
    });

    it('should include date range parameters when provided', () => {
      const productId = 1;
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-12-31T00:00:00');
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getKardexByProductId(productId, 0, 5, '', startDate, endDate).subscribe();

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}kardex-by-product` &&
        request.params.has('startDate') &&
        request.params.has('endDate')
      );
      expect(req.request.params.has('startDate')).toBe(true);
      expect(req.request.params.has('endDate')).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle custom page and size parameters', () => {
      const productId = 1;
      const page = 2;
      const size = 10;
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getKardexByProductId(productId, page, size, '', null, null).subscribe();

      const req = httpMock.expectOne((request) =>
        request.params.get('page') === '2' &&
        request.params.get('size') === '10'
      );
      req.flush(mockResponse);
    });
  });

  describe('purchaseAdjustment', () => {
    it('should create a purchase adjustment', () => {
      const mockRequest: KardexPurchaseRequest = {
        productId: 1,
        quantity: 10,
        unitPrice: 100,
        date: '2024-01-01',
        details: 'Purchase adjustment'
      };

      const mockResponse: ResponseDto<any> = {
        status: 201,
        message: 'Created',
        data: { id: 1, ...mockRequest }
      };

      service.purchaseAdjustment(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.productId).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}purchase-adjustment` &&
        request.params.get('lang') === 'es'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });

    it('should handle error when creating purchase adjustment', () => {
      const mockRequest: KardexPurchaseRequest = {
        productId: 1,
        quantity: 10,
        unitPrice: 100,
        date: '2024-01-01',
        details: 'Purchase adjustment'
      };

      service.purchaseAdjustment(mockRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}purchase-adjustment?lang=es`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('saleAdjustment', () => {
    it('should create a sale adjustment', () => {
      const mockRequest: KardexSaleRequest = {
        productId: 1,
        quantity: 5,
        date: '2024-01-01',
        details: 'Sale adjustment'
      };

      const mockResponse: ResponseDto<any> = {
        status: 201,
        message: 'Created',
        data: { id: 1, ...mockRequest }
      };

      service.saleAdjustment(mockRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.productId).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}sale-adjustment` &&
        request.params.get('lang') === 'es'
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });

  describe('getAllKardexForExport', () => {
    it('should retrieve all kardex records for export', () => {
      const productId = 1;
      const startDate = new Date('2024-01-01T00:00:00');
      const endDate = new Date('2024-12-31T00:00:00');
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: {
          content: [
            { id: 1, date: '2024-01-01', quantity: 10 },
            { id: 2, date: '2024-02-01', quantity: 20 }
          ]
        }
      };

      service.getAllKardexForExport(productId, startDate, endDate).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.content.length).toBe(2);
      });

      const req = httpMock.expectOne((request) =>
        request.params.get('productId') === '1' &&
        request.params.get('size') === '1000000' &&
        request.params.has('startDate') &&
        request.params.has('endDate')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should retrieve all kardex records without date filters', () => {
      const productId = 1;
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getAllKardexForExport(productId, null, null).subscribe();

      const req = httpMock.expectOne((request) =>
        request.params.get('productId') === '1' &&
        !request.params.has('startDate') &&
        !request.params.has('endDate')
      );
      req.flush(mockResponse);
    });
  });

  describe('getLatestKardexByProductId', () => {
    it('should retrieve the latest kardex record for a product', () => {
      const productId = 1;
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: {
          id: 100,
          productId: 1,
          date: '2024-12-31',
          balanceQuantity: 50,
          balanceUnitPrice: 150
        }
      };

      service.getLatestKardexByProductId(productId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.id).toBe(100);
        expect(response.data.productId).toBe(1);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}latest-kardex-by-product` &&
        request.params.get('productId') === '1' &&
        request.params.get('lang') === 'es'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle when no kardex records exist', () => {
      const productId = 1;
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'No records found',
        data: null
      };

      service.getLatestKardexByProductId(productId).subscribe(response => {
        expect(response.data).toBeNull();
      });

      const req = httpMock.expectOne(`${API_URL}latest-kardex-by-product?productId=1&lang=es`);
      req.flush(mockResponse);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      // Este método es privado, pero lo probamos indirectamente a través de los métodos públicos
      const productId = 1;
      const testDate = new Date('2024-03-15T12:00:00');
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getKardexByProductId(productId, 0, 5, '', testDate, testDate).subscribe();

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}kardex-by-product` &&
        request.params.has('startDate') &&
        request.params.has('endDate')
      );
      // Verificar que la fecha fue formateada (contiene guiones y tiene formato yyyy-MM-dd)
      const startDate = req.request.params.get('startDate');
      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      req.flush(mockResponse);
    });

    it('should format single digit months and days with leading zeros', () => {
      const productId = 1;
      const testDate = new Date('2024-01-05T12:00:00');
      const mockResponse: ResponseDto<any> = {
        status: 200,
        message: 'Success',
        data: { content: [] }
      };

      service.getKardexByProductId(productId, 0, 5, '', testDate, null).subscribe();

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}kardex-by-product` &&
        request.params.has('startDate')
      );
      // Verificar que tiene el formato correcto con ceros al inicio
      const startDate = req.request.params.get('startDate');
      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      req.flush(mockResponse);
    });
  });
});
