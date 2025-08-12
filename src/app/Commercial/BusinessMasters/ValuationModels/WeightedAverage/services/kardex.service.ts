import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Observable } from 'rxjs';
import { ResponseDto } from '../../models/ResponseDto';

let API_URL = environment.API_URL + 'kardex/weighted-average/';

@Injectable({
  providedIn: 'root'
})
export class KardexService {
  private apiUrl = API_URL;

  constructor(private http: HttpClient) { }

  getKardexByProductId(productId: number, page = 0, size = 5, sort= '', startDate: Date | null, endDate: Date | null): Observable<ResponseDto<any>> {
    let params = new HttpParams()
      .set('productId', productId)
      .set('page', page)
      .set('size', size)
      if (sort) params = params.set('sort', sort);
      if (startDate) params = params.set('startDate', startDate.toISOString());
      if (endDate) params = params.set('endDate', endDate.toISOString());

    return this.http.get<ResponseDto<any>>(`${this.apiUrl}kardex-by-product`, { params });
  }

}
