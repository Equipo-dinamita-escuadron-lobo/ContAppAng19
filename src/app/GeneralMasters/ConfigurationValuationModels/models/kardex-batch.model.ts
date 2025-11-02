/**
 * DTO para errores en el procesamiento batch
 */
export interface KardexBatchError {
  productId?: string;
  productName?: string;
  errorMessage: string;
  errorCode?: string;
  timestamp?: Date;
}

/**
 * Resultado del procesamiento batch de kardex
 */
export interface KardexBatchProcessingResult {
  /** Total de registros a procesar */
  totalRecords: number;
  
  /** Registros procesados exitosamente */
  processedRecords: number;
  
  /** Registros fallidos */
  failedRecords: number;
  
  /** Indica si el proceso fue exitoso */
  success: boolean;
  
  /** Lista de errores encontrados */
  errors?: KardexBatchError[];
}

/**
 * Respuesta completa del servidor para operaciones batch
 */
export interface KardexBatchResponse {
  /** Datos del resultado del procesamiento */
  data: KardexBatchProcessingResult;
  
  /** Código de estado HTTP */
  status: number;
  
  /** Mensaje descriptivo */
  message: string;
}
