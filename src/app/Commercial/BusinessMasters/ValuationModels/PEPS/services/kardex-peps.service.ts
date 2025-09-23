import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../../models/ResponseDto';

@Injectable({
  providedIn: 'root'
})
export class KardexPepsService {

  private readonly apiUrl = `${environment.API_URL}kardex/peps/`;

  constructor(private readonly http: HttpClient) { }

  /**
   * Formatea una fecha a formato yyyy-MM-dd (ejemplo: 2024-01-01)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  
  getKardexByProduc(productId: number , page = 0, size = 5, sort= '', startDate: Date | null, endDate: Date | null):Observable<ResponseDto<any>>{
    let params = new HttpParams()
      .set('productId', productId)
      .set('page', page)
      .set('size', size)
      if(sort) params=params.set('sort', sort);
      if(startDate) params=params.set('startDate', this.formatDate(startDate));
      if(endDate) params=params.set('endDate', this.formatDate(endDate));

      return this.http.get<ResponseDto<any>>(`${this.apiUrl}kardexlist`, {params});
  }


}
