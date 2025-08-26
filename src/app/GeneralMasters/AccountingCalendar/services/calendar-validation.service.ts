import { Injectable } from '@angular/core';
import { CalendarDay } from '../models/accounting-calendar.model';

/**
 * Servicio centralizado para validaciones del calendario
 * Responsabilidad: Validaciones reutilizables
 */
@Injectable({
  providedIn: 'root'
})
export class CalendarValidationService {

  /**
   * Valida que el ID de empresa sea válido
   * @param enterpriseId ID de la empresa
   * @returns true si es válido
   */
  isValidEnterpriseId(enterpriseId: string): boolean {
    return !!enterpriseId && enterpriseId.trim().length > 0;
  }

  /**
   * Valida que el año sea válido
   * @param year Año a validar
   * @returns true si es válido
   */
  isValidYear(year: number): boolean {
    const currentYear = new Date().getFullYear();
    return year >= 1900 && year <= currentYear + 10;
  }

  /**
   * Valida que un día se pueda modificar
   * @param day Día a validar
   * @returns true si se puede modificar
   */
  canModifyDay(day: CalendarDay): boolean {
    return day.isCurrentMonth;
  }

  /**
   * Valida que un mes se pueda modificar
   * @param month Número del mes (0-11)
   * @returns true si se puede modificar
   */
  canModifyMonth(month: number): boolean {
    return month >= 0 && month <= 11;
  }

  /**
   * Obtiene mensaje de error para empresa inválida
   * @returns Mensaje de error
   */
  getInvalidEnterpriseMessage(): string {
    return 'ID de empresa no válido';
  }

  /**
   * Obtiene mensaje de error para año inválido
   * @returns Mensaje de error
   */
  getInvalidYearMessage(): string {
    return 'Año no válido';
  }

  /**
   * Obtiene mensaje de error para día no modificable
   * @returns Mensaje de error
   */
  getDayNotModifiableMessage(): string {
    return 'No se puede modificar días de otros meses';
  }
}
