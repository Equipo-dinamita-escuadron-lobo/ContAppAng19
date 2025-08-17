/**
 * Constantes globales para el módulo de calendario contable
 */

// Constantes del calendario
export const CALENDAR_CONSTANTS = {
  // Rango dinámico de años: desde 2000 hasta 55 años en el futuro
  get MIN_YEAR() { return 2000; },
  get MAX_YEAR() { return new Date().getFullYear() + 55; },
  MONTHS_IN_YEAR: 12,
  DAYS_IN_WEEK: 7,
  WEEKS_IN_MONTH: 6,
  TOTAL_DAYS_IN_GRID: 42,
  FIRST_MONTH_INDEX: 0,
  LAST_MONTH_INDEX: 11,
  DEFAULT_BATCH_SIZE: 30, // Tamaño del lote para crear fechas
  MAX_DAYS_IN_YEAR: 366   // Año bisiesto máximo
} as const;

// Constantes de paginación
export const PAGINATION_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 1000,
  DEFAULT_PAGE: 0
} as const;

// Constantes de nombres
export const NAME_CONSTANTS = {
  MONTH_NAMES: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ],
  DAY_NAMES: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa']
} as const;

// Constantes de mensajes
export const MESSAGE_CONSTANTS = {
  SUCCESS: {
    DATE_STATE_CHANGED: 'Estado Cambiado',
    DATE_OPENED: 'Fecha Abierta',
    DATE_CLOSED: 'Fecha Cerrada',
    MONTH_STATE_CHANGED: 'Estado del Mes Cambiado',
    MASS_CLOSE_SUCCESS: 'Cierre Masivo Exitosa',
    MASS_OPEN_SUCCESS: 'Apertura Masiva Exitosa',
  },
  ERROR: {
    LOAD_CALENDAR: 'No se pudo cargar el calendario contable',
    CHANGE_DATE_STATE: 'No se pudo cambiar el estado del periodo',
    CHANGE_MONTH_STATE: 'No se pudo cambiar el estado del mes',
    MASS_CLOSE: 'No se pudo cerrar todos los periodos',
    MASS_OPEN: 'No se pudo abrir todos los periodos',
  },
  CONFIRMATION: {
    MONTH_STATE_CHANGE: 'Confirmar Cambio de Estado',
  },
  LABELS: {
    YES: 'Sí',
    NO: 'No',
    CANCEL: 'Cancelar',
    YES_OPEN_ALL: 'Sí, abrir todos',
    YES_CLOSE_ALL: 'Sí, cerrar todos',
    YES_OPEN_MONTH: 'Sí, abrir mes',
    YES_CLOSE_MONTH: 'Sí, cerrar mes'
  }
} as const;

// Constantes de estilos CSS
export const CSS_CLASS_CONSTANTS = {
  MONTH_STATUS: {
    FULLY_CLOSED: 'month-fully-closed',
    FULLY_OPEN: 'month-fully-open'
  },
  DAY_STATUS: {
    OTHER_MONTH: 'other-month',
    CLOSED: 'closed',
    OPEN: 'open',
    TODAY: 'today',
    CLICKABLE: 'clickable'
  }
} as const;
