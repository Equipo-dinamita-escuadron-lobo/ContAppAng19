import { Pipe, PipeTransform } from '@angular/core';
import { Account } from '../models/ChartAccount';

@Pipe({
  name: 'filterAccounts', 
  standalone: true   
})
export class FilterPipe implements PipeTransform {

  /**
 * Transforma la lista de cuentas filtrando aquellas que coincidan con el valor de búsqueda.
 * 
 * @param accounts - Lista de cuentas a filtrar.
 * @param filterValue - Valor a buscar en las cuentas.
 * @returns Un array de cuentas que cumplen con el filtro, o la lista original si no hay cuentas o filtro proporcionado.
 */
  transform(accounts: Account[], filterValue: string): Account[] {
    if (!accounts || !filterValue) {
      return accounts;
    }

    const lowercaseFilter = filterValue.toLowerCase();
    return this.filterAccountsRecursive(accounts, lowercaseFilter);
  }

  /**
 * Filtra recursivamente las cuentas y subcuentas, buscando coincidencias con el valor de filtro.
 * 
 * @param accounts - Lista de cuentas a filtrar, que puede incluir subcuentas.
 * @param filterValue - Valor a buscar en las cuentas y subcuentas.
 * @returns Un array de cuentas filtradas que coinciden con el valor de búsqueda, incluyendo las subcuentas si es necesario.
 */
  filterAccountsRecursive(accounts: Account[], filterValue: string): Account[] {
    let filteredAccounts: Account[] = [];

    accounts.forEach(account => {
      const filteredSubAccounts = account.children ?
        this.filterAccountsRecursive(account.children, filterValue) :
        [];

      const accountMatchesFilter = account.code.toLowerCase().includes(filterValue) || account.description.toLowerCase().includes(filterValue);

      if (accountMatchesFilter || filteredSubAccounts.length > 0) {
        const accountCopy: Account = { ...account, children: filteredSubAccounts };

        if (filteredSubAccounts.length > 0) {
          accountCopy.showSubAccounts = true;
          this.expandParentAccounts(account);
        } else if (accountMatchesFilter && account.parentAccount) {
          this.expandParentAccounts(account.parentAccount);
        }

        filteredAccounts.push(accountCopy);
      }
    });

    return filteredAccounts;
  }

  /**
 * Expande recursivamente las cuentas principales de una cuenta, marcándolas para mostrar las subcuentas.
 * 
 * @param account - La cuenta cuya cuenta principal se debe expandir.
 * @returns No devuelve valor, pero modifica el estado de las cuentas principales para mostrar las subcuentas.
 */
  expandParentAccounts(account: Account): void {
    if (account.parentAccount) {
      account.parentAccount.showSubAccounts = true;
      this.expandParentAccounts(account.parentAccount);
    }
  }
}
