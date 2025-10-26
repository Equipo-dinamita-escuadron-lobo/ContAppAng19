/**
 * Define el rango de criterios para la generación del reporte.
 */
interface CriteriaRange {
  fromRange: number;
  toRange: number;
}

/**
 * Define los criterios utilizados para generar el libro auxiliar.
 */
interface CriteriaUsed {
  id: number;
  criteriaType: string; // Ejemplo: 'NUMBER_CLASS'
  criteriaRange: CriteriaRange;
  costCenterId: string;
  startDate: string; // Formato: 'YYYY-MM-DD'
  endDate: string; // Formato: 'YYYY-MM-DD'
}

/**
 * Define la configuración de la plantilla para el reporte exportado.
 */
export interface InfoReportTemplate {
  id: number;
  name: string;
  pathLogotype: string;
  alienation: 'LEFT' | 'CENTER' | 'RIGHT';
  font: string;
  fontSize: number;
  mainColor: string; // Color en formato hexadecimal, ej: '#148798'
}

/**
 * Define la estructura completa de la solicitud para exportar un reporte.
 */
export interface ExportAuxiliaryBookRequest {
  format: 'EXCEL' | 'PDF';
  entName: string;
  criteriaUsed: CriteriaUsed;
  auxBookType: string; // Ejemplo: 'INVENTORY_AND_BALANCES'
  auxBookData: any[]; // Cambiado a 'any[]' para mayor flexibilidad
  infoReportTemplate: InfoReportTemplate;
}
