import { KardexAvailableQuantityResponse } from './../models/KardexAvailableQuantityResponse';
import { Injectable } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseDto } from '../../models/ResponseDto';
import { KardexPurchaseRequest } from '../models/KardexPurchaseRequest';
import { KardexSaleRequest } from '../models/KardexSaleRequest';
import { KardexPurchaseResponse } from '../models/KardexPurchaseResponse';

@Injectable({
  providedIn: 'root'
})
export class KardexPepsService {

  private readonly apiUrl = `${environment.API_URL}kardex/peps/`;

  constructor(private readonly http: HttpClient) { }

 
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  
  getKardexByProduct(productId: number , page = 0, size = 5, sort= '', startDate: Date | null, endDate: Date | null):Observable<ResponseDto<any>>{
    let params = new HttpParams()
      .set('productId', productId)
      .set('page', page)
      .set('size', size)
      if(sort) params=params.set('sort', sort);
      if(startDate) params=params.set('startDate', this.formatDate(startDate));
      if(endDate) params=params.set('endDate', this.formatDate(endDate));

      return this.http.get<ResponseDto<any>>(`${this.apiUrl}kardexlist`, {params});
  }

  /**
   * Obtiene todos los registros del kardex para exportar
   */
  getAllKardexForExport(productId: number, startDate: Date | null, endDate: Date | null): Observable<ResponseDto<any>> {
    let params = new HttpParams()
    .set('productId', productId)
    .set('page', 0)
    .set('size', 1000000);

    if (startDate) {
      const formattedStartDate = this.formatDate(startDate);
      params = params.set('startDate', formattedStartDate);
    }
    if (endDate) {
      const formattedEndDate = this.formatDate(endDate);
      params = params.set('endDate', formattedEndDate);
    }
    return this.http.get<ResponseDto<any>>(`${this.apiUrl}kardexlist`,{params});
    
  }


  /**
   * Crea un ajuste de compra en el kardex
   */
  purchaseAdjustment(request:KardexPurchaseRequest):Observable<ResponseDto<any>>{
    return this.http.post<ResponseDto<any>>(`${this.apiUrl}purchase-adjustment`, request);
  }

   /**
   * Crea un ajuste de venta en el kardex
   */
  saleAdjustment(request: KardexSaleRequest): Observable<ResponseDto<any>> {
    return this.http.post<ResponseDto<any>>(`${this.apiUrl}sale-adjustment`, request);
  }

  /**
   * Obtiene los lotes disponibles (con toda la info del backend)
   */
  getAvailableQuantity(productId: number): Observable<ResponseDto<KardexAvailableQuantityResponse[]>> {
    return this.http.get<ResponseDto<KardexAvailableQuantityResponse[]>>(
      `${this.apiUrl}kardex-available-quantity/${productId}`
    );
  }


}
