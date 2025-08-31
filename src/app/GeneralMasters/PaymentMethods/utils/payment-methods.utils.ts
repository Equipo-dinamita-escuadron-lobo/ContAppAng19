import { Account } from '../../AccountCatalogue/models/ChartAccount';

/**
 * Utilidades para métodos de pago
 * Centraliza funciones comunes reutilizables
 */
export class PaymentMethodsUtils {

  /**
   * Recorre recursivamente una estructura de cuentas y recoge todas las cuentas auxiliares (8 dígitos)
   * Las cuentas auxiliares son las de mayor detalle que se usan para registrar movimientos específicos.
   *
   * @param item - El nodo actual de la cuenta que se está procesando
   * @param auxiliaryAccounts - La lista acumulada de cuentas auxiliares
   * @returns Una lista de cuentas auxiliares (8 dígitos)
   */
  static collectAuxiliaryAccounts(item: Account, auxiliaryAccounts: Account[]): Account[] {
    // Si la cuenta actual tiene 8 dígitos, es una cuenta auxiliar
    if (item.code && item.code.length === 8) {
      auxiliaryAccounts.push(item);
    }

    // Recorrer recursivamente todos los hijos para encontrar más cuentas auxiliares
    if (item.children && item.children.length > 0) {
      item.children.forEach((child: Account) => PaymentMethodsUtils.collectAuxiliaryAccounts(child, auxiliaryAccounts));
    }

    return auxiliaryAccounts;
  }

  /**
   * Filtra cuentas auxiliares válidas (8 dígitos, con código y descripción)
   * Asegura que las cuentas auxiliares tengan toda la información necesaria
   *
   * @param auxiliaryAccounts - Lista de cuentas auxiliares (8 dígitos) a filtrar
   * @returns Lista de cuentas auxiliares válidas con código y descripción completos
   */
  static filterValidAuxiliaryAccounts(auxiliaryAccounts: Account[]): Account[] {
    return auxiliaryAccounts.filter((account: Account) => {
      const hasValidCode = account.code && account.code.trim() !== '' && account.code.length === 8;
      const hasValidDescription = account.description && account.description.trim() !== '';
      return hasValidCode && hasValidDescription;
    });
  }
}
