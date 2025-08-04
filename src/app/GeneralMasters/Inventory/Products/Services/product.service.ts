import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { delay, Observable, of, switchMap, combineLatest, map, forkJoin, from } from 'rxjs';
import { Product, ProductList } from '../Models/Product';
import { ProductType } from '../../ProductTypes/Models/ProductType';
import { UnitOfMeasure } from '../../MeasurementUnits/Models/UnitOfMeasure';
import { Category } from '../../Category/Models/Category';
import { UnitOfMeasureService } from '../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../Category/Services/category.service';
import { ProductTypeService } from '../../ProductTypes/Services/product-type.service';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private unitOfMeasureService: UnitOfMeasureService,
    private categoryService: CategoryService,
    private productTypeService: ProductTypeService
  ) {}

  getProducts(enterpriseId:string): Observable<ProductList[]> {
    return this.http.get<Product[]>(`${API_URL}products/findAll/${enterpriseId}`).pipe(
      switchMap((products: Product[]) => {
        // Obtener datos relacionados
        const unitOfMeasures$ = this.unitOfMeasureService.getUnitOfMeasures(enterpriseId);
        const categories$ = this.categoryService.getCategories(enterpriseId);
        const productTypes$ = this.productTypeService.getProductTypes(enterpriseId);
        
        return combineLatest([unitOfMeasures$, categories$, productTypes$]).pipe(
          switchMap(([unitOfMeasures, categories, productTypes]) => {
            // Crear mapas para búsqueda rápida
            const unitOfMeasureMap = new Map(unitOfMeasures.map(um => [um.id, um]));
            const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
            const productTypeMap = new Map(productTypes.map(pt => [pt.id, pt]));
            
            // Transformar productos a ProductList con nombres
            const transformedProducts = products.map(product => {
              let productType: ProductType | null = null;
              
              // Verificar si el producto ya tiene el objeto productType completo
              if (product.productType) {
                productType = product.productType;
              }
              // Si no, buscar por productTypeId
              else if (product.productTypeId) {
                productType = productTypeMap.get(product.productTypeId) || null;
              }
              
              return {
                ...product,
                name: product.itemType, // Mapear itemType a name
                unitOfMeasureName: unitOfMeasureMap.get(product.unitOfMeasureId)?.name || 'N/A',
                categoryName: categoryMap.get(product.categoryId)?.name || 'N/A',
                productType: productType,
                productTypeName: productType?.name || 'N/A',
                state: product.state === 'true' // Convertir string a boolean
              } as ProductList;
            });

            // Si no hay tipos de productos en el mapa, hacer consultas individuales
            const productsNeedingIndividualQueries = transformedProducts.filter(product => 
              (product as any).productTypeId && !product.productType
            );

            if (productsNeedingIndividualQueries.length > 0) {
              const individualQueries = productsNeedingIndividualQueries.map(product => 
                this.productTypeService.getProductTypeById((product as any).productTypeId.toString()).pipe(
                  map(productType => ({ productId: product.id, productType }))
                )
              );

              return forkJoin(individualQueries).pipe(
                map(results => {
                  const individualProductTypeMap = new Map(results.map(r => [r.productId, r.productType]));
                  
                  return transformedProducts.map(product => {
                    if ((product as any).productTypeId && !product.productType) {
                      const individualProductType = individualProductTypeMap.get(product.id);
                      if (individualProductType) {
                        product.productType = individualProductType;
                        product.productTypeName = individualProductType.name;
                      }
                    }
                    return product;
                  });
                })
              );
            }

            return of(transformedProducts);
          })
        );
      })
    );
  }

  getProductsBasic(enterpriseId:string): Observable<Product[]> {
    const url = `${API_URL}products/findAll/${enterpriseId}`;
    return this.http.get<Product[]>(url);
  }

  createProduct(product: Product): Observable<Product> {
    const url = `${environment.API_URL}products/create`;
    return this.http.post<Product>(url, product);
  }

  // Ahora acepta el ID y los datos como parámetros separados.
  updateProduct(id: number, productData: Product): Observable<Product> {
    const url = `${API_URL}products/update/${id}`; // La URL se construye con el ID recibido.
    // El cuerpo de la petición son los datos del producto.
    return this.http.put<Product>(url, productData);
  }
  
  getProductById(id: number): Observable<Product> {
    const url = `${environment.API_URL}products/findById/${id}`;
    return this.http.get<Product>(url);
  }

  deleteProduct(id: number): Observable<Product> {
    const url = `${API_URL}products/delete/${id}`;
    return this.http.delete<Product>(url);
  }
}