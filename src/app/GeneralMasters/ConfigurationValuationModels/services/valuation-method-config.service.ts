import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ValuationMethodConfig,
  ValuationMethodConfigResponse,
  InventoryConfigType
} from '../models/valuation-method.model';
import {
  KardexBatchResponse,
  KardexBatchProcessingResult
} from '../models/kardex-batch.model';


/**
 * URLs base para cada microservicio
 */
const MICROSERVICE_URLS = {
  PEPS: environment.API_URL + 'kardex/peps/batch/',
  WEIGHTED_AVERAGE: environment.API_URL + 'kardex/weighted-average/batch/'
};



/**
 * Servicio para la gestión de configuración de métodos de valuación
 */
@Injectable({
  providedIn: 'root'
})
export class ValuationMethodConfigService {

  constructor(private http: HttpClient) { }

  
  /**
   * Obtiene la URL base del microservicio según el método de valuación
   * @param valuationMethod Método de valuación (PEPS o WEIGHTED_AVERAGE)
   * @returns URL base del microservicio correspondiente
   */
  private getMicroserviceUrl(valuationMethod: InventoryConfigType): string {
    return MICROSERVICE_URLS[valuationMethod];
  }

  /**
   * Aplica la configuración del método de valuación para una empresa
   * Esto procesará el batch de kardex según el método seleccionado
   *
   * @param config Configuración del método de valuación
   * @returns Observable con la respuesta del servidor
   */
  applyValuationMethodConfig(config: ValuationMethodConfig): Observable<ValuationMethodConfigResponse> {
    // Determinar qué microservicio usar según el método de valuación
    const baseUrl = this.getMicroserviceUrl(config.valuationMethod);
    const url = `${baseUrl}process-enterprise/${config.enterpriseId}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    console.log(`Llamando a microservicio ${config.valuationMethod}:`, url);

    return this.http.post<KardexBatchResponse>(url, null, { headers }).pipe(
      map(response => {
        const isSuccess = response.status === 200 && response.data.success;

        return {
          enterpriseId: config.enterpriseId,
          inventoryConfigType: config.valuationMethod,
          message: isSuccess
            ? `${response.message}. Procesados: ${response.data.processedRecords}/${response.data.totalRecords}`
            : `Error en el procesamiento. Exitosos: ${response.data.processedRecords}, Fallidos: ${response.data.failedRecords}`,
          success: isSuccess
        };
      }),
      catchError(error => {
        console.error(`Error al aplicar configuración en ${config.valuationMethod}:`, error);
        return throwError(() => ({
          error: {
            message: error.error?.message || 'Error al procesar la solicitud',
            details: error
          }
        }));
      })
    );
  }

  /**
   * Obtiene la configuración actual del método de valuación para una empresa
   *
   * @param enterpriseId ID de la empresa
   * @returns Observable con la configuración actual
   */
  getCurrentConfig(enterpriseId: string): Observable<InventoryConfigType> {
    // Aquí podrías implementar un endpoint GET si existiera en el backend
    // Por ahora retorna un valor por defecto
    return new Observable(observer => {
      observer.next('WEIGHTED_AVERAGE');
      observer.complete();
    });
  }

  /**
   * Valida si una empresa puede cambiar su método de valuación
   *
   * @param enterpriseId ID de la empresa
   * @returns Observable con el resultado de la validación
   */
  canChangeValuationMethod(enterpriseId: string): Observable<boolean> {
    // Aquí podrías implementar validaciones específicas del backend
    return new Observable(observer => {
      observer.next(true);
      observer.complete();
    });
  }

  /**
   * Procesa el batch de kardex según el método de valuación configurado
   * Este método es el que realmente ejecuta el procesamiento en el backend
   *
   * @param enterpriseId ID de la empresa
   * @param valuationMethod Método de valuación a utilizar
   * @returns Observable con los resultados del procesamiento
   */
  processBatchForEnterprise(
    enterpriseId: string, 
    valuationMethod: InventoryConfigType
  ): Observable<KardexBatchProcessingResult> {
    const baseUrl = this.getMicroserviceUrl(valuationMethod);
    const url = `${baseUrl}process-enterprise/${enterpriseId}`;
    
    return this.http.post<KardexBatchResponse>(url, null).pipe(
      map(response => response.data),
      catchError(error => {
        console.error(`Error al procesar batch en ${valuationMethod}:`, error);
        return throwError(() => error);
      })
    );
  }
}
