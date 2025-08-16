/**
 * Constantes globales para el módulo de calendario contable
 */

// Constantes de tiempo (en milisegundos)
export const TIME_CONSTANTS = {
  LOADER_DELAY_MS: 150,
  BACKEND_PROCESSING_DELAY_MS: 500,
  NOTIFICATION_DISPLAY_TIME_MS: 3000,
  NAVIGATION_DELAY_MS: 1500
} as const;

// Constantes del calendario
export const CALENDAR_CONSTANTS = {
  MIN_YEAR: 2000,
  MAX_YEAR: 2080,
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
    MONTH_STATE_CHANGED: 'Estado del Mes Cambiado',
    MASS_CLOSE_SUCCESS: 'Cierre Masivo Exitosa',
    MASS_OPEN_SUCCESS: 'Apertura Masiva Exitosa',
    DATE_OPENED: 'Fecha abierta exitosamente',
    DATE_CLOSED: 'Fecha cerrada exitosamente'
  },
  ERROR: {
    LOAD_CALENDAR: 'No se pudo cargar el calendario contable',
    CHANGE_DATE_STATE: 'No se pudo cambiar el estado del periodo',
    CHANGE_MONTH_STATE: 'No se pudo cambiar el estado del mes',
    MASS_CLOSE: 'No se pudo cerrar todos los periodos',
    MASS_OPEN: 'No se pudo abrir todos los periodos',
    DATE_TOGGLE_FAILED: 'Error al cambiar el estado de la fecha',
    CREATE_YEAR_DATES: 'No se pudieron crear las fechas del año'
  },
  CONFIRMATION: {
    MASS_CLOSE: '¿Desea cerrar todos los periodos contables del año seleccionado? Esta acción no se puede deshacer.',
    MASS_OPEN: '¿Desea abrir todos los periodos contables del año seleccionado? Esta acción no se puede deshacer.',
    MONTH_STATE_CHANGE: 'Confirmar Cambio de Estado del Mes'
  }
} as const;

// Constantes de estilos CSS
export const CSS_CLASS_CONSTANTS = {
  MONTH_STATUS: {
    FULLY_CLOSED: 'month-fully-closed',
    FULLY_OPEN: 'month-fully-open',
    MIXED: 'month-mixed'
  },
  DAY_STATUS: {
    OTHER_MONTH: 'other-month',
    CLOSED: 'closed',
    OPEN: 'open',
    TODAY: 'today',
    CLICKABLE: 'clickable'
  }
} as const;
