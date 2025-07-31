
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Account } from '../../../GeneralMasters/AccountCatalogue/models/ChartAccount';

export const cuentasDiferentesValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const depositAccount = control.get('depositAccount')?.value;
  const refundAccount = control.get('refundAccount')?.value;
  // Solo ejecutar la validación si ambos campos tienen valor
  if (depositAccount && refundAccount) {
    return depositAccount === refundAccount ? { cuentasIguales: true } : null;
  }

  return null; // No hay error si cualquiera de los campos es null o está vacío
};

  

/**
 * Recorre recursivamente una estructura de cuentas y recoge todos los elementos hoja (sin hijos) en una lista.
 * Si el nodo actual tiene hijos, se recursiona sobre ellos. Si no tiene hijos, se agrega a la lista de hojas.
 *
 * @param item - El nodo actual de la cuenta que se está procesando.
 * @param leaves - La lista acumulada de hojas donde se agregarán los nodos sin hijos.
 * @returns Una lista de cuentas que son hojas (sin hijos).
 */
  export const collectLeaves=(item: Account, leaves: Account[]): Account[] => {
    if (item.children && item.children.length > 0) {
      // Recorrer todos los hijos
      item.children.forEach(child => collectLeaves(child, leaves));
    } else {
      // Si no hay hijos, agregar el nodo actual a la lista de hojas
      leaves.push(item);
    }
    return leaves;
  }