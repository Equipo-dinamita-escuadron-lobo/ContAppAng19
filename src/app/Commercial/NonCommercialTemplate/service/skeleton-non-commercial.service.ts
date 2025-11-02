import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { EntData, LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture2 } from '../../InvoiceTemplate/models/Facture2';
import { ProductList2 } from '../models/Product2';
import { Tag } from '../models/Tag';


let API_URL = environment.API_URL;
@Injectable({
  providedIn: 'root'
})
export class SkeletonNonCommercialService {

  private localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  private entData: EntData | null = this.localStorageMethods.loadEnterpriseData();
  private enterpriseId: string = '';

  constructor(private http:HttpClient) {
    this.enterpriseIdLocalStorage();
  }


  createNonCommercialEntry(facture: Facture2):Observable<void>{
    return this.http.post<void>(`${API_URL}factures/skeleton/non-commercial-entry`,facture);
  }
  createNonCommercialExit(facture:Facture2):Observable<void>{
    return this.http.post<void>(`${API_URL}factures/skeleton/non-commercial-exit`,facture);

  }
  getAllProductsByEnterpriseId(): Observable<{ content: ProductList2[], page: any }> {
    const params = new HttpParams().set('enterpriseId', this.enterpriseId);
    return this.http.get<{ content: ProductList2[], page: any }>(`${API_URL}products/findActivate`, { params });
  }

  getAllNonCommercialTag():Observable<Tag[]>{
    return this.http.get<Tag[]>(`${API_URL}config/tag/findAll/${this.enterpriseId}`);
  }

  private enterpriseIdLocalStorage() {
    if (!this.entData) {
      throw new Error('Enterprise data not found in local storage');
    }
    this.enterpriseId = this.entData.id;
  }

}
