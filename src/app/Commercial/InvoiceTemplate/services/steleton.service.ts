import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { Facture2 } from '../models/Facture2';
import { Product2 } from '../models/Product2';


let API_URL = environment.API_URL + 'factures/';

@Injectable({
  providedIn: 'root'
})
export class SteletonService {

  constructor(private http: HttpClient) { }

  createPurchaseSkeleton(facture: Facture2): Observable<void> {
    return this.http.post<void>(`${API_URL}/skeleton/purchase`, facture);
  }

  createSaleSkeleton(facture: Facture2): Observable<void> {
    return this.http.post<void>(`${API_URL}/skeleton/sale`, facture);
  }

  createSaleForReceiptSkeleton(facture: Facture2): Observable<void> {
    return this.http.post<void>(`${API_URL}/skeleton/sale-for-receipt`, facture);
  }

  createReturnOnSaleSkeleton(factCode: number, product: Product2): Observable<void> {
    return this.http.post<void>(`${API_URL}/skeleton/return-on-sale/${factCode}`, product);
  }

  createReturnOnPurchaseSkeleton(factCode: number, product: Product2): Observable<void> {
    return this.http.post<void>(`${API_URL}/skeleton/return-on-purchase/${factCode}`, product);
  }

}
