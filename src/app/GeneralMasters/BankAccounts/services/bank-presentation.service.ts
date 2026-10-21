import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BankPresentationService {

  /**
   * Obtiene la descripción formateada de las monedas
   */
  getCurrenciesDisplay(currencyCodes: string[]): string {
    if (!currencyCodes || currencyCodes.length === 0) {
      return '';
    }

    const currencyMap: { [key: string]: string } = {
      'COP': 'COP - Peso Colombiano',
      'USD': 'USD - Dólar Estadounidense',
      'EUR': 'EUR - Euro',
      'GBP': 'GBP - Libra Esterlina',
      'CHF': 'CHF - Franco Suizo',
      'JPY': 'JPY - Yen Japonés'
    };

    const descriptions = currencyCodes.map(code => currencyMap[code] || code);
    return descriptions.join(', ');
  }

  /**
   * Obtiene el texto del estado del banco
   */
  formatState(status: boolean): string {
    return status ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtiene la severidad del estado para el componente p-tag
   */
  getStateSeverity(status: boolean): 'success' | 'danger' {
    return status ? 'success' : 'danger';
  }

  /**
   * Verifica si el banco está activo
   */
  isActive(status: boolean): boolean {
    return status;
  }
}