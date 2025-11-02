/**
 * Tipo de método de valuación de inventario
 */
export type InventoryConfigType = 'PEPS' | 'WEIGHTED_AVERAGE';

/**
 * Modelo para la configuración del método de valuación
 */
export interface ValuationMethodConfig {
  /** ID de la empresa */
  enterpriseId: string;
  
  /** Método de valuación seleccionado */
  valuationMethod: InventoryConfigType;
  
  /** Fecha de aplicación de la configuración */
  effectiveDate?: Date;
}

/**
 * Respuesta del servidor al actualizar la configuración
 */
export interface ValuationMethodConfigResponse {
  /** ID de la empresa */
  enterpriseId: string;
  
  /** Método de valuación configurado */
  inventoryConfigType: InventoryConfigType;
  
  /** Mensaje de respuesta */
  message?: string;
  
  /** Indica si la operación fue exitosa */
  success: boolean;
}

/**
 * Modelo de información del método de valuación
 */
export interface ValuationMethodInfo {
  label: string;
  value: InventoryConfigType;
  description: string;
  advantages?: string[];
  disabled?: boolean;
}
