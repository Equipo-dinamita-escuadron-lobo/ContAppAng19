import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import { Observable, of, switchMap, combineLatest, map, forkJoin, catchError } from 'rxjs';
import { Product, ProductList, Page } from '../Models/Product';
import { UnitOfMeasureService } from '../../MeasurementUnits/Services/unit-of-measure.service';
import { CategoryService } from '../../Category/Services/category.service';
import { ProductTypeService } from '../../ProductTypes/Services/product-type.service';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
  constructor(
    private readonly http: HttpClient,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly categoryService: CategoryService,
    private readonly productTypeService: ProductTypeService
  ) {}

  getProducts(enterpriseId: string, numPage?: number, size?: number, sortField: string = 'name', sortOrder: string = 'asc', search?: string): Observable<Page<ProductList>> {
    let params: any = { enterpriseId };
    if (numPage !== undefined) params.numPage = numPage;  // Usar 'numPage' como en terceros
    if (size !== undefined) params.size = size;
    params.sortField = sortField;
    params.sortOrder = sortOrder;
    if (search) params.search = search;

    return this.http.get<Page<Product>>(`${API_URL}products/findAll`, { params }).pipe(
      switchMap((page: Page<Product>) => this.transformProductsPage(page, enterpriseId)),
      catchError(err => {
        console.error('Error al obtener productos:', err);
        return of(this.createEmptyPage());
      })
    );
  }

  
  getActiveProducts(enterpriseId: string): Observable<Page<ProductList>> {
    let params: any = { enterpriseId };
    return this.http.get<Page<Product>>(`${API_URL}products/findActivate`, { params }).pipe(
      switchMap((page: Page<Product>) => this.transformProductsPage(page, enterpriseId)),
      catchError(err => {
        return of(this.createEmptyPage());
      })
    );
  }

  /**
   * Transforma una página de productos agregando información relacionada
   */
  private transformProductsPage(page: Page<Product>, enterpriseId: string): Observable<Page<ProductList>> {
    // Recopilar IDs únicos
    const ids = this.collectRelatedIds(page.content);

    // Obtener datos relacionados en paralelo
    return combineLatest([
      this.getRelatedData(ids.unitOfMeasureIds, 'unitOfMeasure', enterpriseId),
      this.getRelatedData(ids.categoryIds, 'category', enterpriseId),
      this.getRelatedData(ids.productTypeIds, 'productType', enterpriseId)
    ]).pipe(
      map(([unitOfMeasures, categories, productTypes]) => {
        // Crear mapas
        const maps = this.createLookupMaps(unitOfMeasures, categories, productTypes);

        // Transformar productos
        const transformedProducts = page.content.map(product =>
          this.transformProduct(product, maps)
        );

        return { ...page, content: transformedProducts };
      })
    );
  }

  /**
   * Recopila IDs únicos de elementos relacionados
   */
  private collectRelatedIds(products: Product[]): {
    unitOfMeasureIds: Set<number>,
    categoryIds: Set<number>,
    productTypeIds: Set<number>
  } {
    const unitOfMeasureIds = new Set<number>();
    const categoryIds = new Set<number>();
    const productTypeIds = new Set<number>();

    products.forEach(product => {
      if (product.unitOfMeasureId) unitOfMeasureIds.add(product.unitOfMeasureId);
      if (product.categoryId) categoryIds.add(product.categoryId);
      if (product.productTypeId) productTypeIds.add(product.productTypeId);
    });

    return { unitOfMeasureIds, categoryIds, productTypeIds };
  }

  /**
   * Obtiene datos relacionados por tipo
   */
  private getRelatedData(ids: Set<number>, type: string, enterpriseId: string): Observable<any[]> {
    if (ids.size === 0) return of([]);

    const queries = Array.from(ids).map(id => {
      let observable: Observable<any>;

      switch (type) {
        case 'unitOfMeasure':
          observable = this.unitOfMeasureService.getUnitOfMeasuresId(id.toString(), enterpriseId);
          break;
        case 'category':
          observable = this.categoryService.getCategoryById(id.toString(), enterpriseId);
          break;
        case 'productType':
          observable = this.productTypeService.getProductTypeById(id.toString(), enterpriseId);
          break;
        default:
          return of(null);
      }

      return observable.pipe(
        catchError(err => {
          console.warn(`Error al obtener ${type} ${id}:`, err);
          return of(null);
        })
      );
    });

    return forkJoin(queries).pipe(
      map(results => results.filter(result => result !== null)),
      catchError(err => {
        console.warn(`Error en forkJoin para ${type}:`, err);
        return of([]);
      })
    );
  }

  
  /**
   * Crea mapas de búsqueda
   */
  private createLookupMaps(unitOfMeasures: any[], categories: any[], productTypes: any[]) {
    // Asegurar que todos los arrays sean válidos
    const safeUnitOfMeasures = Array.isArray(unitOfMeasures) ? unitOfMeasures : [];
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeProductTypes = Array.isArray(productTypes) ? productTypes : [];

    return {
      unitOfMeasure: new Map(safeUnitOfMeasures.map(item => [item.id, item])),
      category: new Map(safeCategories.map(item => [item.id, item])),
      productType: new Map(safeProductTypes.map(item => [item.id, item])),
    };
  }

  /**
   * Transforma un producto individual
   */
  private transformProduct(product: Product, maps: any): ProductList {
    const productType = product.productType || maps.productType.get(product.productTypeId);
    const unitOfMeasure = maps.unitOfMeasure.get(product.unitOfMeasureId);
    const category = maps.category.get(product.categoryId);

    return {
      ...product,
      unitOfMeasureName: unitOfMeasure?.name || 'N/A',
      categoryName: category?.name || 'N/A',
      productType: productType || null,
      productTypeName: productType?.name || 'N/A',
      state: typeof product.state === 'boolean' ? product.state : product.state === 'true'
    } as ProductList;
  }


  /**
   * Crea una página vacía para errores
   */
  private createEmptyPage(): Page<ProductList> {
    return {
      content: [],
      page: {
        totalElements: 0,
        totalPages: 0,
        size: 10,
        number: 0
      }
    };
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