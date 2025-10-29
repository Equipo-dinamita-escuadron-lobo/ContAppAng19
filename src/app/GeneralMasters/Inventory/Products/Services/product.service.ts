import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { delay, Observable, of, switchMap, combineLatest, map, forkJoin, from, catchError } from 'rxjs';
import { Product, ProductList, Page } from '../Models/Product';
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

  getProducts(enterpriseId: string, numPage?: number, size?: number, sortField: string = 'name', sortOrder: string = 'asc', search?: string): Observable<Page<ProductList>> {
    let params: any = { enterpriseId };
    if (numPage !== undefined) params.numPage = numPage;
    if (size !== undefined) params.size = size;
    params.sortField = sortField;
    params.sortOrder = sortOrder;
    if (search) params.search = search;

    return this.http.get<Page<Product>>(`${API_URL}products/findAll`, { params }).pipe(
      switchMap((page: Page<Product>) => {
        // Recopilar IDs únicos de elementos relacionados
        const unitOfMeasureIds = new Set<number>();
        const categoryIds = new Set<number>();
        const productTypeIds = new Set<number>();

        page.content.forEach((product: any) => {
          if (product.unitOfMeasureId) unitOfMeasureIds.add(product.unitOfMeasureId);
          if (product.categoryId) categoryIds.add(product.categoryId);
          if (product.productTypeId) productTypeIds.add(product.productTypeId);
        });

        // Crear observables para obtener elementos por ID
        const unitOfMeasureQueries = Array.from(unitOfMeasureIds).map(id =>
          this.unitOfMeasureService.getUnitOfMeasuresId(id.toString(), enterpriseId).pipe(
            catchError(err => {
              console.warn(`Error al obtener unidad de medida ${id}:`, err);
              return of(null);
            })
          )
        );

        const categoryQueries = Array.from(categoryIds).map(id =>
          this.categoryService.getCategoryById(id.toString(), enterpriseId).pipe(
            catchError(err => {
              console.warn(`Error al obtener categoría ${id}:`, err);
              return of(null);
            })
          )
        );

        const productTypeQueries = Array.from(productTypeIds).map(id =>
          this.productTypeService.getProductTypeById(id.toString(), enterpriseId).pipe(
            catchError(err => {
              console.warn(`Error al obtener tipo de producto ${id}:`, err);
              return of(null);
            })
          )
        );

        const taxes$ = this.taxService.getTaxes(enterpriseId).pipe(
          map(taxes => taxes),
          catchError(err => {
            console.warn('Error al obtener impuestos, continuando sin información de impuestos:', err);
            return of([]);
          })
        );

        // Ejecutar todas las consultas en paralelo
        return combineLatest([
          unitOfMeasureQueries.length > 0 ? forkJoin(unitOfMeasureQueries) : of([]),
          categoryQueries.length > 0 ? forkJoin(categoryQueries) : of([]),
          productTypeQueries.length > 0 ? forkJoin(productTypeQueries) : of([]),
          taxes$
        ]).pipe(
          switchMap(([unitOfMeasures, categories, productTypes, taxes]) => {
            // Filtrar resultados nulos y validar arrays
            const safeUnitOfMeasures = Array.isArray(unitOfMeasures) ? unitOfMeasures.filter(um => um !== null) : [];
            const safeCategories = Array.isArray(categories) ? categories.filter(cat => cat !== null) : [];
            const safeProductTypes = Array.isArray(productTypes) ? productTypes.filter(pt => pt !== null) : [];
            const safeTaxes = Array.isArray(taxes) ? taxes : [];

            // Crear mapas para búsqueda rápida
            const unitOfMeasureMap = new Map<number, any>(safeUnitOfMeasures.map((um: any) => [um.id, um]));
            const categoryMap = new Map<number, any>(safeCategories.map((cat: any) => [cat.id, cat]));
            const productTypeMap = new Map<number, any>(safeProductTypes.map((pt: any) => [pt.id, pt]));
            const taxMap = new Map<number, any>(safeTaxes.map((tax: any) => [tax.interest, tax]));
            
                          // Transformar productos a ProductList con nombres
            const transformedProducts = page.content.map((product: any) => {
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
              let taxDisplayText = '';
              if (Array.isArray(product.taxPercentage)) {
                // Si es un array, buscar cada impuesto
                const taxTexts: string[] = [];
                product.taxPercentage.forEach((taxPercent: number) => {
                  let taxInfo = taxMap.get(taxPercent);
                  if (!taxInfo && safeTaxes.length > 0) {
                    taxInfo = safeTaxes.find((tax: any) => Math.abs(tax.interest - taxPercent) < 0.01);
                  }
                  if (taxInfo) {
                    taxTexts.push(`${taxInfo.code} (${taxInfo.interest}%)`);
                  } else {
                    taxTexts.push(`${taxPercent}%`);
                  }
                });
                taxDisplayText = taxTexts.join(', ');
              } else {
                // Si es un solo valor (compatibilidad hacia atrás)
                let taxInfo = taxMap.get(product.taxPercentage);
                if (!taxInfo && safeTaxes.length > 0) {
                  taxInfo = safeTaxes.find((tax: any) => Math.abs(tax.interest - product.taxPercentage) < 0.01);
                }
                taxDisplayText = taxInfo ? `${taxInfo.code} (${taxInfo.interest}%)` : `${product.taxPercentage}%`;
              }
              
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

            return of({
              ...page,
              content: transformedProducts
            } as Page<ProductList>);
          })
        );
      }),
      catchError(err => {
        console.error('Error al obtener productos:', err);
        // Retornar una página vacía en caso de error
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true
        } as Page<ProductList>);
      })
    );
  }

  getProductsBasic(enterpriseId: string, numPage?: number, size?: number, sortField: string = 'name', sortOrder: string = 'asc', search?: string): Observable<Product[]> {
    let params: any = { enterpriseId };
    if (numPage !== undefined) params.numPage = numPage;
    if (size !== undefined) params.size = size;
    params.sortField = sortField;
    params.sortOrder = sortOrder;
    if (search) params.search = search;

    return this.http.get<Product[]>(`${API_URL}products/findAll`, { params });
  }

  createProduct(product: Product): Observable<Product> {
    const url = `${environment.API_URL}products/create`;
    return this.http.post<Product>(url, product);
  }

  updateProduct(id: number, productData: Product): Observable<Product> {
    const url = `${API_URL}products/update/${id}`;
    return this.http.put<Product>(url, productData);
  }
  
  getProductById(id: number, enterpriseId: string): Observable<Product> {
    const url = `${environment.API_URL}products/findById/${id}/${enterpriseId}`;
    return this.http.get<Product>(url);
  }

  deleteProduct(id: number, enterpriseId: string): Observable<Product> {
    const url = `${API_URL}products/delete/${id}/${enterpriseId}`;
    return this.http.delete<Product>(url);
  }

  changeProductState(id: number, enterpriseId: string): Observable<void> {
    const url = `${API_URL}products/changeState/${id}/${enterpriseId}`;
    return this.http.put<void>(url, {});
  }
}