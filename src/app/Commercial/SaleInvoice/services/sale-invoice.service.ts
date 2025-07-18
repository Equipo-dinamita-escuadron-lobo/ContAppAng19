import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

let API_URL = environment.API_URL + 'factures/';

@Injectable({
  providedIn: 'root'
})
export class SaleInvoiceService {

  constructor(private http: HttpClient) { }

  /**
   * Envía la factura al servidor para su almacenamiento, utilizando una solicitud POST.
   * La respuesta se espera en formato Blob (por ejemplo, un archivo).
   * @param facture - Objeto que representa la factura a guardar.
   * @returns Observable<Blob> - Un observable que emite el archivo de la factura almacenada.
   */
  saveInvoice(facture: any): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post(API_URL, facture, { headers: headers, responseType: 'blob' });
  }

  /**
   * Genera una vista previa de la factura enviando la solicitud al servidor.
   * La respuesta se espera en formato Blob (por ejemplo, un archivo PDF de la vista previa).
   * @param facture - Objeto que representa la factura para la cual se generará la vista previa.
   * @returns Observable<Blob> - Un observable que emite el archivo de la vista previa de la factura.
   */
  generateInvoicePreview(facture: any): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post(`${API_URL}generatePreview`, facture, { headers: headers, responseType: 'blob' });

  }

  /**
   * Genera un código QR para una factura dada su ID.
   * La respuesta se espera en formato Blob, que representará la imagen del código QR.
   * @param factId - El ID de la factura para la cual se generará el código QR.
   * @returns Observable<Blob> - Un observable que emite el archivo Blob (imagen del código QR) generado.
   */
  generateInvoiceQR(factId: number): Observable<Blob> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.get(`${API_URL}facture/?factId=${factId}`, {
      headers: headers,
      responseType: 'blob'
    });
  }
}
