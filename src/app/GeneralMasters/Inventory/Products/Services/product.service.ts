import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { delay, Observable, of, switchMap, combineLatest, map, forkJoin, from, catchError } from 'rxjs';
import { Product, ProductList } from '../Models/Product';
import { ProductType } from '../../ProductTypes/Models/ProductType';
import { UnitOfMeasure } from '../../MeasurementUnits/Models/UnitOfMeasure';
import { Category } from '../../Category/Models/Category';
import { UnitOfMeasureService } from '../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../Category/Services/category.service';
import { ProductTypeService } from '../../ProductTypes/Services/product-type.service';
import { TaxService } from '../../../Taxes/services/tax.service';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private http: HttpClient,
    private unitOfMeasureService: UnitOfMeasureService,
    private categoryService: CategoryService,
    private productTypeService: ProductTypeService,
    private taxService: TaxService
  ) {}

  getProducts(enterpriseId:string): Observable<ProductList[]> {
    return this.http.get<Product[]>(`${API_URL}products/findAll/${enterpriseId}`).pipe(
      switchMap((products: Product[]) => {
        // Obtener datos relacionados
        const unitOfMeasures$ = this.unitOfMeasureService.findActivate(enterpriseId);
        const categories$ = this.categoryService.findActivate(enterpriseId);
        const productTypes$ = this.productTypeService.getProductTypes(enterpriseId);
        const taxes$ = this.taxService.getTaxes(enterpriseId).pipe(
          map(taxes => taxes),
          // Si falla la obtención de impuestos, continuar con array vacío
          catchError(err => {
            console.warn('Error al obtener impuestos, continuando sin información de impuestos:', err);
            return of([]);
          })
        );
        
        return combineLatest([unitOfMeasures$, categories$, productTypes$, taxes$]).pipe(
          switchMap(([unitOfMeasures, categories, productTypes, taxes]) => {
            // Crear mapas para búsqueda rápida
            const unitOfMeasureMap = new Map<number, any>(unitOfMeasures.map((um: any) => [um.id, um]));
            const categoryMap = new Map<number, any>(categories.map((cat: any) => [cat.id, cat]));
            const productTypeMap = new Map<number, any>(productTypes.map((pt: any) => [pt.id, pt]));
            const taxMap = new Map<number, any>(taxes.map((tax: any) => [tax.interest, tax]));
            
                          // Transformar productos a ProductList con nombres
            const transformedProducts = products.map((product: any) => {
              let productType: ProductType | null = null;
              
              // Verificar si el producto ya tiene el objeto productType completo
              if (product.productType) {
                productType = product.productType;
              }
              // Si no, buscar por productTypeId
              else if (product.productTypeId) {
                productType = productTypeMap.get(product.productTypeId) || null;
              }
              
              // Buscar información del impuesto - hacerlo más robusto
              let taxInfo = taxMap.get(product.taxPercentage);
              
              // Si no se encuentra exactamente, buscar por aproximación
              if (!taxInfo && taxes.length > 0) {
                taxInfo = taxes.find((tax: any) => Math.abs(tax.interest - product.taxPercentage) < 0.01);
              }
              
              const taxDisplayText = taxInfo ? `${taxInfo.code} (${taxInfo.interest}%)` : `${product.taxPercentage}%`;
              
              // Obtener nombres de manera segura
              const unitOfMeasure = unitOfMeasureMap.get(product.unitOfMeasureId);
              const category = categoryMap.get(product.categoryId);
              
              return {
                ...product,
                name: product.name,
                unitOfMeasureName: unitOfMeasure ? unitOfMeasure.name : 'N/A',
                categoryName: category ? category.name : 'N/A',
                productType: productType,
                productTypeName: productType?.name || 'N/A',
                taxDisplayText: taxDisplayText,
                state: typeof product.state === 'boolean' ? product.state : product.state === 'true' // Manejar tanto boolean como string
              } as ProductList;
            });

            // Si no hay tipos de productos en el mapa, hacer consultas individuales
            const productsNeedingIndividualQueries = transformedProducts.filter((product: any) =>
              product.productTypeId && !product.productType
            );

            if (productsNeedingIndividualQueries.length > 0) {
              const individualQueries = productsNeedingIndividualQueries.map((product: any) =>
                this.productTypeService.getProductTypeById(product.productTypeId.toString(), enterpriseId).pipe(
                  map((productType: ProductType) => ({ productId: product.id, productType }))
                )
              );

              return forkJoin(individualQueries).pipe(
                map((results: any[]) => {
                  const individualProductTypeMap = new Map(results.map((r: any) => [r.productId, r.productType]));

                  return transformedProducts.map((product: any) => {
                    if (product.productTypeId && !product.productType) {
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
            }            return of(transformedProducts);
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
  updateProduct(id: number, productData: Product, enterpriseId: string): Observable<Product> {
    const url = `${API_URL}products/update/${enterpriseId}/${id}`; // La URL se construye con el ID recibido.
    // El cuerpo de la petición son los datos del producto.
    return this.http.put<Product>(url, productData);
  }
  
  getProductById(id: number, enterpriseId: string): Observable<Product> {
    const url = `${environment.API_URL}products/findById/${enterpriseId}/${id}`;
    return this.http.get<Product>(url);
  }

  deleteProduct(id: number, enterpriseId: string): Observable<Product> {
    const url = `${API_URL}products/delete/${enterpriseId}/${id}`;
    return this.http.delete<Product>(url);
  }

  changeProductState(id: number, enterpriseId: string): Observable<void> {
    const url = `${API_URL}products/changeState/${enterpriseId}/${id}`;
    return this.http.put<void>(url, {});
  }
}