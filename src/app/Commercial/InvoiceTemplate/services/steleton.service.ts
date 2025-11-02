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
    return this.http.post<void>(`${API_URL}factures/skeleton/sale-for-receipt`, facture);
  }

  createReturnOnSaleSkeleton(returnRequest: any): Observable<any> {
    return this.http.post<any>(`${API_URL}factures/skeleton/return-on-sale`, returnRequest);
  }

  createReturnOnPurchaseSkeleton(returnRequest: any): Observable<any> {
    return this.http.post<any>(`${API_URL}factures/skeleton/return-on-purchase`, returnRequest);
  }

  getAllFactures(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}factures/skeleton`);
  }

  getFactureByCode(factCode: number): Observable<any> {
    return this.http.get<any>(`${API_URL}factures/skeleton/by-code/${factCode}`);
  }

  getTotalReturnedQuantity(factCode: number, productId: number): Observable<number> {
    return this.http.get<number>(`${API_URL}factures/skeleton/${factCode}/products/${productId}/returned-quantity`);
  }

  getAllProductsByEnterpriseId(): Observable<{ content: ProductList2[], page: any }> {
    const params = new HttpParams().set('enterpriseId', this.enterpriseId);
    return this.http.get<{ content: ProductList2[], page: any }>(`${API_URL}products/findActivate`, { params });
  }

  private enterpriseIdLocalStorage() {
    if (!this.entData) {
      throw new Error('Enterprise data not found in local storage');
    }
    this.enterpriseId = this.entData.id;
  }
}
