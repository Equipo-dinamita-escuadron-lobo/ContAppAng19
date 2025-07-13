import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { delay, Observable, of } from 'rxjs';
import { Product } from '../Models/Product';
import { ProductType } from '../Models/ProductType';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(private http: HttpClient) {}

  getProducts(enterpriseId:string): Observable<Product[]> {
    // --- CORRECCIÓN AQUÍ ---
    // Ahora los objetos cumplen con la estructura de la clase ProductType.
    // Usamos el `enterpriseId` que llega como parámetro para que los datos sean consistentes.
    const mockProductTypes: ProductType[] = [
      { 
        id: 1, 
        name: 'Producto', 
        description: 'Corresponde a bienes tangibles que se compran o venden.',
        enterpriseId: enterpriseId
      },
      { 
        id: 2, 
        name: 'Servicio',
        description: 'Corresponde a una prestación o un trabajo intangible.',
        enterpriseId: enterpriseId
      },
    ];
    
    const mockProducts: Product[] = [
      {
        id: 'a1b2c3d4-0001-4000-8000-111111111111',
        code: 'PROD-001',
        itemType: 'Producto',
        description: 'Laptop Gamer Avanzada 15"',
        quantity: 25,
        taxPercentage: 19,
        creationDate: new Date('2024-05-10'),
        unitOfMeasureId: 1,
        categoryId: 1,
        enterpriseId: enterpriseId,
        cost: 4500000,
        state: 'Activo',
        reference: 'LG-XG-15',
        productType: mockProductTypes[0], // Correctamente tipado ahora
      },
      {
        id: 'a1b2c3d4-0002-4000-8000-222222222222',
        code: 'SERV-001',
        itemType: 'Servicio',
        description: 'Soporte Técnico Especializado (Hora)',
        quantity: 999,
        taxPercentage: 19,
        creationDate: new Date('2024-03-20'),
        unitOfMeasureId: 2,
        categoryId: 2,
        enterpriseId: enterpriseId,
        cost: 120000,
        state: 'Activo',
        reference: 'SOP-TEC-HR',
        productType: mockProductTypes[1], // Correctamente tipado ahora
      },
      // ... (el resto de los productos simulados) ...
       {
        id: 'a1b2c3d4-0003-4000-8000-333333333333',
        code: 'PROD-002',
        itemType: 'Producto',
        description: 'Mouse Inalámbrico Ergonómico',
        quantity: 150,
        taxPercentage: 19,
        creationDate: new Date('2024-06-01'),
        unitOfMeasureId: 1,
        categoryId: 1,
        enterpriseId: enterpriseId,
        cost: 95000,
        state: 'Activo',
        reference: 'MS-ERG-WL',
        productType: mockProductTypes[0],
      },
      {
        id: 'a1b2c3d4-0004-4000-8000-444444444444',
        code: 'PROD-003',
        itemType: 'Producto',
        description: 'Teclado Mecánico RGB',
        quantity: 75,
        taxPercentage: 19,
        creationDate: new Date('2024-06-01'),
        unitOfMeasureId: 1,
        categoryId: 1,
        enterpriseId: enterpriseId,
        cost: 350000,
        state: 'Inactivo',
        reference: 'KB-MECH-RGB',
        productType: mockProductTypes[0],
      },
      {
        id: 'a1b2c3d4-0005-4000-8000-555555555555',
        code: 'SERV-002',
        itemType: 'Servicio',
        description: 'Consultoría de Software (Paquete 10 Horas)',
        quantity: 50,
        taxPercentage: 19,
        creationDate: new Date('2024-01-15'),
        unitOfMeasureId: 3,
        categoryId: 2,
        enterpriseId: enterpriseId,
        cost: 1000000,
        state: 'Activo',
        reference: 'CONS-SOFT-10H',
        productType: mockProductTypes[1],
      },
       {
        id: 'a1b2c3d4-0003-4000-8000-333333333333',
        code: 'PROD-002',
        itemType: 'Producto',
        description: 'Mouse Inalámbrico Ergonómico',
        quantity: 150,
        taxPercentage: 19,
        creationDate: new Date('2024-06-01'),
        unitOfMeasureId: 1,
        categoryId: 1,
        enterpriseId: enterpriseId,
        cost: 95000,
        state: 'Activo',
        reference: 'MS-ERG-WL',
        productType: mockProductTypes[0],
      },
      {
        id: 'a1b2c3d4-0004-4000-8000-444444444444',
        code: 'PROD-003',
        itemType: 'Producto',
        description: 'Teclado Mecánico RGB',
        quantity: 75,
        taxPercentage: 19,
        creationDate: new Date('2024-06-01'),
        unitOfMeasureId: 1,
        categoryId: 1,
        enterpriseId: enterpriseId,
        cost: 350000,
        state: 'Inactivo',
        reference: 'KB-MECH-RGB',
        productType: mockProductTypes[0],
      },
      {
        id: 'a1b2c3d4-0005-4000-8000-555555555555',
        code: 'SERV-002',
        itemType: 'Servicio',
        description: 'Consultoría de Software (Paquete 10 Horas)',
        quantity: 50,
        taxPercentage: 19,
        creationDate: new Date('2024-01-15'),
        unitOfMeasureId: 3,
        categoryId: 2,
        enterpriseId: enterpriseId,
        cost: 1000000,
        state: 'Activo',
        reference: 'CONS-SOFT-10H',
        productType: mockProductTypes[1],
      },
    ];

    return of(mockProducts).pipe(delay(500));

    // --- FIN: CÓDIGO SIMULADO ---

    // --- CÓDIGO ORIGINAL (CONEXIÓN AL BACKEND) ---
    // const url = `${API_URL}products/findAll/${enterpriseId}`;
    // return this.http.get<Product[]>(url);
  }

  createProduct(product: Product): Observable<Product> {
    const url = `${environment.API_URL}products/create`;
    return this.http.post<Product>(url, product);
  }

  updateProduct(product: Product): Observable<Product> {
    const id = product.id; // Obtenemos el ID del producto
    const url = `${environment.API_URL}products/update/${id}`; // Suponiendo que el backend espera el ID del producto en la URL
    console.log(product);
    return this.http.put<Product>(url, product); // Usamos el método PUT para actualizar el producto
  }

  getProductById(id: string): Observable<Product> {
    const url = `${environment.API_URL}products/findById/${id}`;
    return this.http.get<Product>(url);
  }

  deleteProduct(id: string): Observable<Product> {
    const url = `${environment.API_URL}products/delete/${id}`;
    return this.http.delete<Product>(url);
  }
}
