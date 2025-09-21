import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { Facture2 } from '../models/Facture2';
import { Product2, ProductList2 } from '../models/Product2';
import { LocalStorageMethods, EntData } from '../../../Shared/Methods/local-storage.method';

let API_URL = environment.API_URL;

@Injectable({
  providedIn: 'root'
})
export class SteletonService {

  private localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  private entData: EntData | null = this.localStorageMethods.loadEnterpriseData();
  private enterpriseId: string = '';

  constructor(private http: HttpClient) {
    this.enterpriseIdLocalStorage();
  }

  createPurchaseSkeleton(facture: Facture2): Observable<void> {
    return this.http.post<void>(`${API_URL}factures/skeleton/purchase`, facture);
  }

  createSaleForReceiptSkeleton(facture: Facture2): Observable<void> {
    return this.http.post<void>(`${API_URL}/actures/skeleton/sale-for-receipt`, facture);
  }

  createReturnOnSaleSkeleton(factCode: number, product: Product2): Observable<void> {
    return this.http.post<void>(`${API_URL}factures/skeleton/return-on-sale/${factCode}`, product);
  }

  createReturnOnPurchaseSkeleton(factCode: number, product: Product2): Observable<void> {
    return this.http.post<void>(`${API_URL}factures/skeleton/return-on-purchase/${factCode}`, product);
  }

  getAllProductsByEnterpriseId(): Observable<ProductList2[]> {
    return this.http.get<ProductList2[]>(`${API_URL}products/findAll/${this.enterpriseId}`);
  }

  private enterpriseIdLocalStorage() {
    if (!this.entData) {
      throw new Error('Enterprise data not found in local storage');
    }
    this.enterpriseId = this.entData.id;
  }
}
