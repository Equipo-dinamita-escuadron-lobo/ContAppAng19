/**
 * Tipos utilitarios para el módulo de calendario contable
 */

// Tipo para el timer del loader
export type LoaderTimer = ReturnType<typeof setTimeout> | null;

// Tipo para los años disponibles
export interface AvailableYear {
  label: string;
  value: number;
}

// Tipo para la respuesta paginada del backend
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Tipo para el estado de carga
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Tipo para las acciones del calendario
export type CalendarAction = 'open' | 'close' | 'toggle';

// Tipo para el estado de un día específico
export interface DayState {
  date: string;
  isClosed: boolean;
  isCurrentMonth: boolean;
}

// Tipo para el estado de un mes
export interface MonthState {
  month: number;
  year: number;
  status: 'fully_open' | 'fully_closed';
}

// Tipo para las notificaciones del sistema
export interface CalendarNotification {
  severity: 'success' | 'error' | 'warning' | 'info';
  summary: string;
  detail: string;
  life?: number;
}

// Tipo para las confirmaciones del usuario
export interface CalendarConfirmation {
  header: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  icon?: string;
}
