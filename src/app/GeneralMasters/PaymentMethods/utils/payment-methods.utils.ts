import { Account } from '../../AccountCatalogue/models/ChartAccount';

/**
 * Utilidades para métodos de pago
 * Centraliza funciones comunes reutilizables
 */
export class PaymentMethodsUtils {

  /**
   * Recorre recursivamente una estructura de cuentas y recoge todos los elementos hoja (cuentas auxiliares)
   * Si el nodo actual tiene hijos, se recursiona sobre ellos. Si no tiene hijos, se agrega a la lista de hojas.
   *
   * @param item - El nodo actual de la cuenta que se está procesando
   * @param leaves - La lista acumulada de hojas donde se agregarán los nodos sin hijos
   * @returns Una lista de cuentas que son hojas (cuentas auxiliares sin hijos)
   */
  static collectLeaves(item: Account, leaves: Account[]): Account[] {
    if (item.children && item.children.length > 0) {
      // Recorrer todos los hijos recursivamente
      item.children.forEach((child: Account) => PaymentMethodsUtils.collectLeaves(child, leaves));
    } else {
      // Si no hay hijos, agregar el nodo actual a la lista de hojas (cuentas auxiliares)
      leaves.push(item);
    }
    return leaves;
  }

  /**
   * Filtra cuentas auxiliares válidas (con código y descripción)
   *
   * @param auxiliaryAccounts - Lista de cuentas auxiliares a filtrar
   * @returns Lista de cuentas auxiliares válidas
   */
  static filterValidAuxiliaryAccounts(auxiliaryAccounts: Account[]): Account[] {
    return auxiliaryAccounts.filter((account: Account) => {
      const hasCode = account.code && account.code.trim() !== '';
      const hasDescription = account.description && account.description.trim() !== '';
      return hasCode && hasDescription;
    });
  }
}
