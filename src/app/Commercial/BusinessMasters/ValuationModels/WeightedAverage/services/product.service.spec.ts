import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { ResponseDto } from '../../models/ResponseDto';
import { ProductResponse } from '../models/ProductResponse';
import { environment } from '../../../../../../environments/environment';

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;
  const API_URL = environment.API_URL + 'kardex/weighted-average/';

  // Mock de datos del localStorage
  const mockEntData = {
    id: '123',
    name: 'Test Enterprise'
  };

  beforeEach(() => {
    // Mock del localStorage
    Storage.prototype.getItem = jest.fn((key: string) => {
      if (key === 'entData') {
        return JSON.stringify(mockEntData);
      }
      return null;
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllProducts', () => {
    it('should retrieve all products for the enterprise', () => {
      const mockProducts: ProductResponse[] = [
        {
          id: 1,
          productId: 101,
          name: 'Product 1',
          reference: 'REF001',
          presentation: 'Box',
          manager: 'Manager 1',
          enterpriseId: '123'
        },
        {
          id: 2,
          productId: 102,
          name: 'Product 2',
          reference: 'REF002',
          presentation: 'Unit',
          manager: 'Manager 2',
          enterpriseId: '123'
        }
      ];

      const mockResponse: ResponseDto<ProductResponse[]> = {
        status: 200,
        message: 'Success',
        data: mockProducts
      };

      service.getAllProducts().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data.length).toBe(2);
        expect(response.data[0].name).toBe('Product 1');
      });

      const req = httpMock.expectOne(`${API_URL}products/${mockEntData.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty product list', () => {
      const mockResponse: ResponseDto<ProductResponse[]> = {
        status: 200,
        message: 'Success',
        data: []
      };

      service.getAllProducts().subscribe(response => {
        expect(response.data.length).toBe(0);
      });

      const req = httpMock.expectOne(`${API_URL}products/${mockEntData.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle HTTP error', () => {
      const errorMessage = 'Server error';

      service.getAllProducts().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_URL}products/${mockEntData.id}`);
      req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('constructor', () => {
    it('should throw error when enterprise data is not found in localStorage', () => {
      // Mock localStorage para retornar null
      Storage.prototype.getItem = jest.fn(() => null);

      expect(() => {
        new ProductService(TestBed.inject(HttpClientTestingModule) as any);
      }).toThrow('Enterprise data not found in local storage');
    });

    it('should initialize with enterprise ID from localStorage', () => {
      // El servicio ya está inicializado en beforeEach con datos válidos
      expect(service).toBeTruthy();
      // Verificamos que el servicio puede hacer llamadas (lo que implica que enterpriseId está configurado)
      service.getAllProducts().subscribe();
      const req = httpMock.expectOne(`${API_URL}products/${mockEntData.id}`);
      expect(req.request.url).toContain(mockEntData.id);
      req.flush({ status: 200, message: 'Success', data: [] });
    });
  });
});
