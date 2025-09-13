import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { EntData, LocalStorageMethods } from '../../../../../Shared/Methods/local-storage.method';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../../models/ResponseDto';
import { ProductResponse } from '../models/ProductResponse';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private readonly apiUrl = `${environment.API_URL}/kardex/peps/`;
  private readonly localStorageMethods = new LocalStorageMethods();
  private readonly entData: EntData | null = this.localStorageMethods.loadEnterpriseData();
  private readonly enterpriseId: string;

  constructor(private readonly http: HttpClient) {
    this.enterpriseId=this.getEnterpriseIdFromLocalStorage();
  }

  getAllProducts(): Observable<ResponseDto<ProductResponse[]>> {
    return this.http.get<ResponseDto<ProductResponse[]>>(`${this.apiUrl}products/${this.enterpriseId}`);
  }


  private getEnterpriseIdFromLocalStorage(): string {
    if (!this.entData?.id) {
      throw new Error('Enterprise data not found in local storage');
    }
    return this.entData.id;
  }
}
