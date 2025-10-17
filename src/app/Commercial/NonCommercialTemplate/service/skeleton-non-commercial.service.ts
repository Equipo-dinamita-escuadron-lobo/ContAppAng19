import { Facture } from './../../../../../../frontend_accounting_software/src/app/modules/commercial/purchase-invoice/models/facture';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { EntData, LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Facture2 } from '../../InvoiceTemplate/models/Facture2';
import { ProductList2 } from '../models/Product2';


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
  createNonCommercialExit(facture:Facture):Observable<void>{
    return this.http.post<void>(`${API_URL}factures/skeleton/non-commercial-exit`,facture);

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
