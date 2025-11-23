import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SteletonService } from './steleton.service';
import { environment } from '../../../../environments/environment';
import { Facture2 } from '../models/Facture2';
import { ProductList2 } from '../models/Product2';

describe('SteletonService', () => {
  let service: SteletonService;
  let httpMock: HttpTestingController;
  const API_URL = environment.API_URL;

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
      providers: [SteletonService]
    });

    service = TestBed.inject(SteletonService);
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
        new SteletonService(TestBed.inject(HttpClientTestingModule) as any);
      }).toThrow('Enterprise data not found in local storage');
    });
  });

  describe('createPurchaseSkeleton', () => {
    it('should create a purchase skeleton', () => {
      const mockFacture: Facture2 = {
        factCode: 1001,
        entId: '123',
        thId: 5,
        products: [
          {
            productId: 1,
            amount: 10,
            description: 'Test Product',
            discount: 5,
            unitPrice: 100,
            subtotal: 950,
            taxPercentage: [19]
          }
        ],
        totalValue: '1000',
        totalPay: '950',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 11050501,
        factureType: 'PURCHASE',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createPurchaseSkeleton(mockFacture).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/purchase`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockFacture);
      req.flush(null);
    });

    it('should handle error when creating purchase skeleton', () => {
      const mockFacture: Facture2 = {
        factCode: 1001,
        entId: '123',
        thId: 5,
        products: [],
        totalValue: '1000',
        totalPay: '1000',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 11050501,
        factureType: 'PURCHASE',
        inventoryConfigType: 'WEIGHTED_AVERAGE'
      };

      service.createPurchaseSkeleton(mockFacture).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/purchase`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('createSaleSkeleton', () => {
    it('should create a sale skeleton', () => {
      const mockFacture: Facture2 = {
        factCode: 2001,
        entId: '123',
        thId: 10,
        products: [
          {
            productId: 2,
            amount: 5,
            description: 'Sale Product',
            discount: 0,
            unitPrice: 200,
            subtotal: 1000,
            taxPercentage: [19]
          }
        ],
        totalValue: '1190',
        totalPay: '1190',
        pendingValue: '0',
        expirationDate: '2024-12-31',
        accountingAccount: 41050501,
        factureType: 'SALE',
        inventoryConfigType: 'PEPS'
      };

      service.createSaleSkeleton(mockFacture).subscribe(response => {
        expect(response).toBeUndefined();
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/sale`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockFacture);
      req.flush(null);
    });
  });

  describe('createReturnOnSaleSkeleton', () => {
    it('should create a return on sale skeleton', () => {
      const returnRequest = {
        factCode: 2001,
        productId: 1,
        returnedQuantity: 2,
        reason: 'Defective product'
      };
      const mockResponse = 'Return created successfully';

      service.createReturnOnSaleSkeleton(returnRequest).subscribe(response => {
        expect(response).toBe(mockResponse);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/return-on-sale`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(returnRequest);
      expect(req.request.responseType).toBe('text');
      req.flush(mockResponse);
    });

    it('should handle error when creating return on sale', () => {
      const returnRequest = {
        factCode: 2001,
        productId: 1,
        returnedQuantity: 2
      };

      service.createReturnOnSaleSkeleton(returnRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/return-on-sale`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createReturnOnPurchaseSkeleton', () => {
    it('should create a return on purchase skeleton', () => {
      const returnRequest = {
        factCode: 1001,
        productId: 3,
        returnedQuantity: 1,
        reason: 'Wrong product'
      };
      const mockResponse = 'Return on purchase created successfully';

      service.createReturnOnPurchaseSkeleton(returnRequest).subscribe(response => {
        expect(response).toBe(mockResponse);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/return-on-purchase`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(returnRequest);
      expect(req.request.responseType).toBe('text');
      req.flush(mockResponse);
    });
  });

  describe('getAllFactures', () => {
    it('should retrieve all factures', () => {
      const mockFactures = [
        {
          factCode: 1001,
          entId: '123',
          thId: 5,
          factureType: 'PURCHASE',
          totalValue: '1000'
        },
        {
          factCode: 2001,
          entId: '123',
          thId: 10,
          factureType: 'SALE',
          totalValue: '1500'
        }
      ];

      service.getAllFactures().subscribe(factures => {
        expect(factures).toEqual(mockFactures);
        expect(factures.length).toBe(2);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFactures);
    });

    it('should handle empty factures list', () => {
      service.getAllFactures().subscribe(factures => {
        expect(factures).toEqual([]);
        expect(factures.length).toBe(0);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton`);
      req.flush([]);
    });

    it('should handle error when retrieving factures', () => {
      service.getAllFactures().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getFactureByCode', () => {
    it('should retrieve a facture by code', () => {
      const factCode = 1001;
      const mockFacture = {
        factCode: 1001,
        entId: '123',
        thId: 5,
        products: [
          {
            productId: 1,
            amount: 10,
            description: 'Product 1',
            unitPrice: 100
          }
        ],
        totalValue: '1000',
        factureType: 'PURCHASE'
      };

      service.getFactureByCode(factCode).subscribe(facture => {
        expect(facture).toEqual(mockFacture);
        expect(facture.factCode).toBe(1001);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/by-code/${factCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFacture);
    });

    it('should handle facture not found', () => {
      const factCode = 9999;

      service.getFactureByCode(factCode).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/by-code/${factCode}`);
      req.flush('Facture not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getTotalReturnedQuantity', () => {
    it('should retrieve total returned quantity for a product', () => {
      const factCode = 1001;
      const productId = 5;
      const mockReturnedQuantity = 15;

      service.getTotalReturnedQuantity(factCode, productId).subscribe(quantity => {
        expect(quantity).toBe(mockReturnedQuantity);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/${factCode}/products/${productId}/returned-quantity`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReturnedQuantity);
    });

    it('should return zero when no products have been returned', () => {
      const factCode = 1001;
      const productId = 5;

      service.getTotalReturnedQuantity(factCode, productId).subscribe(quantity => {
        expect(quantity).toBe(0);
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/${factCode}/products/${productId}/returned-quantity`);
      req.flush(0);
    });

    it('should handle error when retrieving returned quantity', () => {
      const factCode = 1001;
      const productId = 5;

      service.getTotalReturnedQuantity(factCode, productId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`${API_URL}factures/skeleton/${factCode}/products/${productId}/returned-quantity`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getAllProductsByEnterpriseId', () => {
    it('should retrieve all products by enterprise ID', () => {
      const mockProducts: ProductList2[] = [
        {
          id: 1,
          name: 'Product 1',
          enterpriseId: '123'
        },
        {
          id: 2,
          name: 'Product 2',
          enterpriseId: '123'
        }
      ];

      const mockResponse = {
        content: mockProducts,
        page: {
          totalElements: 2,
          totalPages: 1,
          size: 10,
          number: 0
        }
      };

      service.getAllProductsByEnterpriseId().subscribe(response => {
        expect(response.content).toEqual(mockProducts);
        expect(response.content.length).toBe(2);
        expect(response.page.totalElements).toBe(2);
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
        request.params.get('enterpriseId') === '123'
      );
      expect(req.request.params.get('enterpriseId')).toBe('123');
      req.flush(mockResponse);
    });

    it('should handle error when retrieving products', () => {
      service.getAllProductsByEnterpriseId().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url === `${API_URL}products/findActivate`
      );
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
