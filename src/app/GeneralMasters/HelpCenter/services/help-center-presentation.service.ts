import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HelpCenterPresentationService {

  /**
   * Trunca la descripción si excede la longitud máxima
   * @param description La descripción a truncar
   * @param maxLength Longitud máxima (por defecto 30)
   * @returns La descripción truncada con puntos suspensivos si es necesario
   */
  truncateDescription(description: string, maxLength: number = 30): string {
    if (!description) return '';
    return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
  }

  /**
   * Formatea el estado booleano a texto legible
   * @param status Estado booleano
   * @returns 'Activo' si true, 'Inactivo' si false
   */
  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la severidad para el componente Tag de PrimeNG
   * @param status Estado booleano
   * @returns 'success' si activo, 'danger' si inactivo
   */
  getStateSeverity(status: boolean): string {
    return status ? 'success' : 'danger';
  }

  /**
   * Verifica si el estado representa un elemento activo
   * @param status Estado booleano
   * @returns true si el estado es true
   */
  isActive(status: boolean): boolean {
    return status === true;
  }
}