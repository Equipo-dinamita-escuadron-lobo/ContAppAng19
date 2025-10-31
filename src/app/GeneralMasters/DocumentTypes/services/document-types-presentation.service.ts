import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DocumentTypesPresentationService {

  /**
   * Obtiene la severidad para el componente Tag de PrimeNG basado en el estado
   * @param status Estado booleano
   * @returns 'success' si activo, 'danger' si inactivo
   */
  getStateSeverity(status: boolean): 'success' | 'danger' {
    return status ? 'success' : 'danger';
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
   * Verifica si el estado representa un elemento activo
   * @param status Estado booleano
   * @returns true si el estado es true
   */
  isActive(status: boolean): boolean {
    return status === true;
  }
}