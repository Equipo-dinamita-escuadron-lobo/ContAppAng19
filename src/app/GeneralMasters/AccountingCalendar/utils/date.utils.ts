/**
 * Utilidades para el manejo de fechas en el calendario contable
 */

/**
 * Formatea una fecha para enviar al backend (formato YYYY-MM-DD)
 * @param date Fecha a formatear
 * @returns Fecha en formato string YYYY-MM-DD
 */
export function formatDateForBackend(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsea una fecha desde el backend (formato YYYY-MM-DD)
 * @param dateString Fecha en formato string
 * @returns Objeto Date
 */
export function parseDateFromBackend(dateString: string): Date {
  if (!dateString || typeof dateString !== 'string') {
    throw new Error('Formato de fecha inválido');
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error('Formato de fecha inválido');
  }
  
  // month - 1 porque Date usa 0-11 para los meses
  return new Date(year, month - 1, day);
}

/**
 * Verifica si una fecha está dentro de un rango
 * @param date Fecha a verificar
 * @param startDate Fecha de inicio del rango
 * @param endDate Fecha de fin del rango
 * @returns true si la fecha está en el rango
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  const time = date.getTime();
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  return time >= startTime && time <= endTime;
}

/**
 * Obtiene el primer día de un mes
 * @param year Año
 * @param month Mes (0-11)
 * @returns Fecha del primer día del mes
 */
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

/**
 * Obtiene el último día de un mes
 * @param year Año
 * @param month Mes (0-11)
 * @returns Fecha del último día del mes
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

/**
 * Verifica si un año es bisiesto
 * @param year Año a verificar
 * @returns true si es bisiesto
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Obtiene el número de días en un mes
 * @param year Año
 * @param month Mes (0-11)
 * @returns Número de días en el mes
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Obtiene el nombre del mes
 * @param month Mes (0-11)
 * @returns Nombre del mes
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return monthNames[month] || 'Mes Desconocido';
}

/**
 * Obtiene el nombre corto del mes
 * @param month Mes (0-11)
 * @returns Nombre corto del mes
 */
export function getShortMonthName(month: number): string {
  const shortMonthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  return shortMonthNames[month] || 'Mes';
}

/**
 * Verifica si una fecha es hoy
 * @param date Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Obtiene la diferencia en días entre dos fechas
 * @param startDate Fecha de inicio
 * @param endDate Fecha de fin
 * @returns Diferencia en días
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Agrega días a una fecha
 * @param date Fecha base
 * @param days Número de días a agregar
 * @returns Nueva fecha
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agrega meses a una fecha
 * @param date Fecha base
 * @param months Número de meses a agregar
 * @returns Nueva fecha
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Agrega años a una fecha
 * @param date Fecha base
 * @param years Número de años a agregar
 * @returns Nueva fecha
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}
