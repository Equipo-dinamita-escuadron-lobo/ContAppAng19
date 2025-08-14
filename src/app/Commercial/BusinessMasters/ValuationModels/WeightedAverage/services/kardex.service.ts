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

  /**
   * Formatea una fecha a formato yyyy-MM-dd (ejemplo: 2024-01-01)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getKardexByProductId(productId: number, page = 0, size = 5, sort= '', startDate: Date | null, endDate: Date | null): Observable<ResponseDto<any>> {
    let params = new HttpParams()
      .set('productId', productId)
      .set('page', page)
      .set('size', size)
      if (sort) params = params.set('sort', sort);
      if (startDate) {
        const formattedStartDate = this.formatDate(startDate);
        params = params.set('startDate', formattedStartDate);
      }
      if (endDate) {
        const formattedEndDate = this.formatDate(endDate);
        params = params.set('endDate', formattedEndDate);
      }

    return this.http.get<ResponseDto<any>>(`${this.apiUrl}kardex-by-product`, { params });
  }

}
