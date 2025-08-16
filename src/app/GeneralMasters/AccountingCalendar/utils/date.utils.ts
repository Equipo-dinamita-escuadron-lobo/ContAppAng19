/**
 * Utilidades para el manejo de fechas en el calendario contable
 */

/**
 * Formatea una fecha al formato YYYY-MM-DD que espera el backend
 * @param date Fecha a formatear
 * @returns Fecha en formato string YYYY-MM-DD
 */
export function formatDateForBackend(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convierte una fecha del backend (string YYYY-MM-DD) a objeto Date
 * @param dateString Fecha en formato string del backend
 * @returns Objeto Date
 */
export function parseDateFromBackend(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * Verifica si una fecha está dentro de un rango
 * @param date Fecha a verificar
 * @param startDate Fecha de inicio del rango
 * @param endDate Fecha de fin del rango
 * @returns true si la fecha está dentro del rango
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Obtiene el primer día del mes
 * @param year Año
 * @param month Mes (0-11)
 * @returns Primer día del mes
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Obtiene el último día del mes
 * @param year Año
 * @param month Mes (0-11)
 * @returns Último día del mes
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Verifica si una fecha es hoy
 * @param date Fecha a verificar
 * @returns true si la fecha es hoy
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Obtiene el nombre del mes en español
 * @param monthIndex Índice del mes (0-11)
 * @returns Nombre del mes en español
 */
export function getMonthName(monthIndex: number): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return monthNames[monthIndex];
}
