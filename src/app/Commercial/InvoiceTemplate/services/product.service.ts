import { Injectable } from '@angular/core';
import { ResponseDto } from '../../BusinessMasters/ValuationModels/models/ResponseDto';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EntData, LocalStorageMethods } from '../../../Shared/Methods/local-storage.method';
import { environment } from '../../../../environments/environment';
import { ProductResponse } from '../models/Product2';


let API_URL = environment.API_URL+'kardex/peps/';

@Injectable({
  providedIn: 'root'
})
export class ProductService{
  private apiUrl = API_URL;
  private localStorageMethods: LocalStorageMethods = new LocalStorageMethods();
  private entData: EntData | null = this.localStorageMethods.loadEnterpriseData();
  private enterpriseId: string = '';

  constructor(private http: HttpClient) {
    this.enterpriseIdLocalStorage();
  }

  getAllProducts(): Observable<ResponseDto<ProductResponse[]>> {
    return this.http.get<ResponseDto<ProductResponse[]>>(`${this.apiUrl}products/${this.enterpriseId}`);
  }

  private enterpriseIdLocalStorage() {
    if (!this.entData) {
      throw new Error('Enterprise data not found in local storage');
    }
    this.enterpriseId = this.entData.id;
  }

}
