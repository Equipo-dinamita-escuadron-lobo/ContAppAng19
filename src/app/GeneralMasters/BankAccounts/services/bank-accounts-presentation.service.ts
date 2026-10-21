import { Injectable, inject } from '@angular/core';
import { BankAccountsService } from './bank-accounts.service';

@Injectable({
  providedIn: 'root'
})
export class BankAccountsPresentationService {
  private readonly bankAccountsService = inject(BankAccountsService);

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

  /**
   * Obtiene la representación en texto del tipo de cuenta bancaria
   * @param accountType Tipo de cuenta bancaria
   * @returns Texto descriptivo del tipo de cuenta
   */
  getAccountTypeDisplay(accountType: string): string {
    return this.bankAccountsService.getAccountTypeDisplay(accountType);
  }

  /**
   * Obtiene la representación en texto de la cuenta contable
   * @param accountingAccountId ID de la cuenta contable
   * @param accountingAccountsMap Mapa de cuentas contables
   * @returns Texto descriptivo de la cuenta contable
   */
  getAccountingAccountDisplay(accountingAccountId: string, accountingAccountsMap: Map<string, string>): string {
    return accountingAccountsMap.get(accountingAccountId.toString()) || accountingAccountId;
  }
}