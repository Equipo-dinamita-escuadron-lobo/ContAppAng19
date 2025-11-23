import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SkeletonNonCommercialService } from './skeleton-non-commercial.service';
import { environment } from '../../../../environments/environment';
import { Facture2 } from '../models/Facture';
import { ProductList2 } from '../models/Product2';
import { Tag } from '../models/Tag';

describe('SkeletonNonCommercialService', () => {
  let service: SkeletonNonCommercialService;
  let httpMock: HttpTestingController;
  const API_URL = environment.API_URL;

  // Mock de datos del localStorage
  const mockEntData = {
    id: '456',
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
      providers: [SkeletonNonCommercialService]
    });

    service = TestBed.inject(SkeletonNonCommercialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('constructor', () => {
    it('should throw error when enterprise data is not found in localStorage', () => {
      Storage.prototype.getItem = jest.fn(() => null);

      expect(() => {
        new SkeletonNonCommercialService(TestBed.inject(HttpClientTestingModule) as any);
      }).toThrow('Enterprise data not found in local storage');
    });

    it('should initialize with enterprise ID from localStorage', () => {
      expect(service).toBeTruthy();
      // Verificamos que el servicio puede hacer llamadas (lo que implica que enterpriseId está configurado)
      service.getAllProductsByEnterpriseId().subscribe();
      const req = httpMock.expectOne((request) =>
        request.params.has('enterpriseId')
      );
      expect(req.request.params.get('enterpriseId')).toBe(mockEntData.id);
      req.flush({ content: [], page: {} });
    });
  });

  describe('createNonCommercialEntry', () => {
    it('should create a non-commercial entry', () => {
      const mockFacture: Facture2 = {
        factId: 3001,
        entId: '456',
        thId: 15,
        factCode: 3001,
        products: [
          {
            productId: 1,
            amount: 20,
            description: 'Entry Product',
            descount: 0,
            unitPrice: 150,
            subtotal: 3000,
            taxPercentage: []
          }
        ],
        totalValue: '3000',
        totalPay: '3000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 14050501,
        tagTitle: 'Donations',
        factureType: 'NON_COMMERCIAL_ENTRY',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createNonCommercialEntry(mockFacture).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-entry`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockFacture);
      req.flush(null);
    });

    it('should handle error when creating non-commercial entry', () => {
      const mockFacture: Facture2 = {
        factId: 3001,
        entId: '456',
        thId: 15,
        factCode: 3001,
        products: [],
        totalValue: '3000',
        totalPay: '3000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 14050501,
        factureType: 'NON_COMMERCIAL_ENTRY',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createNonCommercialEntry(mockFacture).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-entry`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });

    it('should create entry with tag title', () => {
      const mockFacture: Facture2 = {
        factId: 3002,
        entId: '456',
        thId: 15,
        factCode: 3002,
        products: [
          {
            productId: 5,
            amount: 10,
            description: 'Product with tag',
            descount: 0,
            unitPrice: 100,
            subtotal: 1000,
            taxPercentage: []
          }
        ],
        totalValue: '1000',
        totalPay: '1000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 14050501,
        tagTitle: 'Samples',
        factureType: 'NON_COMMERCIAL_ENTRY',
        inventoryConfigType: 'PEPS'
      };

      service.createNonCommercialEntry(mockFacture).subscribe();

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-entry`);
      expect(req.request.body.tagTitle).toBe('Samples');
      req.flush(null);
    });
  });

  describe('createNonCommercialExit', () => {
    it('should create a non-commercial exit', () => {
      const mockFacture: Facture2 = {
        factId: 4001,
        entId: '456',
        thId: 20,
        factCode: 4001,
        products: [
          {
            productId: 2,
            amount: 5,
            description: 'Exit Product',
            descount: 0,
            unitPrice: 200,
            subtotal: 1000,
            taxPercentage: []
          }
        ],
        totalValue: '1000',
        totalPay: '1000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 51050501,
        tagTitle: 'Internal Use',
        factureType: 'NON_COMMERCIAL_EXIT',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createNonCommercialExit(mockFacture).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-exit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockFacture);
      req.flush(null);
    });

    it('should handle error when creating non-commercial exit', () => {
      const mockFacture: Facture2 = {
        factId: 4001,
        entId: '456',
        thId: 20,
        factCode: 4001,
        products: [],
        totalValue: '1000',
        totalPay: '1000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 51050501,
        factureType: 'NON_COMMERCIAL_EXIT',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createNonCommercialExit(mockFacture).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-exit`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle both inventory config types', () => {
      const mockFacturePEPS: Facture2 = {
        factId: 4002,
        entId: '456',
        thId: 20,
        factCode: 4002,
        products: [
          {
            productId: 3,
            amount: 3,
            description: 'PEPS Product',
            descount: 0,
            unitPrice: 150,
            subtotal: 450,
            taxPercentage: []
          }
        ],
        totalValue: '450',
        totalPay: '450',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 51050501,
        factureType: 'NON_COMMERCIAL_EXIT',
        inventoryConfigType: 'PEPS'
      };

      service.createNonCommercialExit(mockFacturePEPS).subscribe();

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/non-commercial-exit`);
      expect(req.request.body.inventoryConfigType).toBe('PEPS');
      req.flush(null);
    });
  });

  describe('getAllProductsByEnterpriseId', () => {
    it('should retrieve all products by enterprise ID', () => {
      const mockProducts: ProductList2[] = [
        {
          id: 1,
          name: 'Product A',
          enterpriseId: '456'
        },
        {
          id: 2,
          name: 'Product B',
          enterpriseId: '456'
        },
        {
          id: 3,
          name: 'Product C',
          enterpriseId: '456'
        }
      ];

      const mockResponse = {
        content: mockProducts,
        page: {
          totalElements: 3,
          totalPages: 1,
          size: 10,
          number: 0
        }
      };

      service.getAllProductsByEnterpriseId().subscribe(response => {
        expect(response.content).toEqual(mockProducts);
        expect(response.content.length).toBe(3);
        expect(response.page.totalElements).toBe(3);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}products/findActivate` &&
        request.params.get('enterpriseId') === mockEntData.id
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty products list', () => {
      const mockResponse = {
        content: [],
        page: {
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0
        }
      };

      service.getAllProductsByEnterpriseId().subscribe(response => {
        expect(response.content).toEqual([]);
        expect(response.content.length).toBe(0);
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}products/findActivate`
      );
      req.flush(mockResponse);
    });

    it('should include enterprise ID parameter in request', () => {
      const mockResponse = {
        content: [],
        page: { totalElements: 0 }
      };

      service.getAllProductsByEnterpriseId().subscribe();

      const req = httpMock.expectOne((request) =>
        request.params.has('enterpriseId') &&
        request.params.get('enterpriseId') === '456'
      );
      expect(req.request.params.get('enterpriseId')).toBe('456');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving products', () => {
      service.getAllProductsByEnterpriseId().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(503);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}products/findActivate`
      );
      req.flush('Service unavailable', { status: 503, statusText: 'Service Unavailable' });
    });
  });

  describe('getAllNonCommercialTag', () => {
    it('should retrieve all non-commercial tags', () => {
      const mockTags: Tag[] = [
        {
          id: 1,
          EnterpriseId: 456,
          title: 'Donations',
          description: 'Products received as donations'
        },
        {
          id: 2,
          EnterpriseId: 456,
          title: 'Samples',
          description: 'Sample products'
        },
        {
          id: 3,
          EnterpriseId: 456,
          title: 'Internal Use',
          description: 'Products for internal use'
        }
      ];

      service.getAllNonCommercialTag().subscribe(tags => {
        expect(tags).toEqual(mockTags);
        expect(tags.length).toBe(3);
        expect(tags[0].title).toBe('Donations');
      });

      const req = httpMock.expectOne(`${API_URL}config/tag/findAll/${mockEntData.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTags);
    });

    it('should handle empty tags list', () => {
      service.getAllNonCommercialTag().subscribe(tags => {
        expect(tags).toEqual([]);
        expect(tags.length).toBe(0);
      });

      const req = httpMock.expectOne(`${API_URL}config/tag/findAll/${mockEntData.id}`);
      req.flush([]);
    });

    it('should use correct enterprise ID in URL', () => {
      service.getAllNonCommercialTag().subscribe();

      const req = httpMock.expectOne(`${API_URL}config/tag/findAll/${mockEntData.id}`);
      expect(req.request.url).toContain(mockEntData.id);
      req.flush([]);
    });

    it('should handle error when retrieving tags', () => {
      service.getAllNonCommercialTag().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}config/tag/findAll/${mockEntData.id}`);
      req.flush('Tags not found', { status: 404, statusText: 'Not Found' });
    });

    it('should retrieve tags with different properties', () => {
      const mockTags: Tag[] = [
        {
          id: 10,
          EnterpriseId: 456,
          title: 'Defective',
          description: 'Defective products'
        }
      ];

      service.getAllNonCommercialTag().subscribe(tags => {
        expect(tags[0].id).toBe(10);
        expect(tags[0].EnterpriseId).toBe(456);
        expect(tags[0].title).toBe('Defective');
        expect(tags[0].description).toBe('Defective products');
      });

      const req = httpMock.expectOne(`${API_URL}config/tag/findAll/${mockEntData.id}`);
      req.flush(mockTags);
    });
  });
});
