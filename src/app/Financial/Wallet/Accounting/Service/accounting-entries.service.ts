import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { CashReceiptService } from '../../CashReceipts/Service/cash-receipt.service';
import { AccountingEntryResponse } from '../../CashReceipts/Model/api';
import { environment } from '../../../../../environments/environment';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { AccountingEntryView, AccountingMovementView } from '../../CashReceipts/Model/view';
import { ApiResponse } from '../../../../Core/Model/apiResponseModel';

@Injectable({
  providedIn: 'root'
})
export class AccountingEntriesService {

   private accountingApiUrl = environment.API_URL + 'accountCatalogue/accounting';

  constructor(
    private http: HttpClient,
    private localStorageMethods: LocalStorageMethods,
    private cashReceiptService: CashReceiptService
  ) { }

  /**
   * Obtiene el asiento contable crudo envuelto en ApiResponse.
   */
  private getAccountingEntryBySourceApi(sourceDocumentId: number, type: string): Observable<ApiResponse<AccountingEntryResponse>> {
    return this.http.get<ApiResponse<AccountingEntryResponse>>(`${this.accountingApiUrl}/entries/by-source/${sourceDocumentId}/${type}`);
  }

  /**
  * ORQUESTADOR: Obtiene el asiento, maneja los estados de error/vacío y enriquece la data.
  */
  getAccountingEntryViewBySource(sourceDocumentId: number, type: string): Observable<AccountingEntryView | null> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    
    if (!enterpriseId) {
      console.warn('No se encontró Enterprise ID');
      return of(null);
    }

    return this.getAccountingEntryBySourceApi(sourceDocumentId, type).pipe(
      switchMap(response => {
        // CASO 1: ACCOUNTINGENTRYNOTFOUND o NO_CONTENT
        if (response.code === 'ACCOUNTINGENTRYNOTFOUND' || response.code === 'NO_CONTENT') {
          console.warn(`Aviso: ${response.message}`);
          return of(null); // Retornamos null para que el componente sepa que no hay nada que mostrar
        }

        // CASO 2: Error genérico de la API (success: false)
        if (!response.success || !response.data) {
          return throwError(() => new Error(response.message || 'Error al obtener el asiento contable'));
        }

        // CASO 3: Éxito, procedemos a enriquecer la data
        const entryApi = response.data;
        const accountIds = [...new Set(entryApi.movements.map(m => m.account))];
        const thirdPartyIds = [...new Set(entryApi.movements.map(m => m.thirdPartyId))];

        return forkJoin({
          entry: of(entryApi),
          accounts: this.cashReceiptService.getAuxiliaryAccountsCached(enterpriseId),
          thirdParties: thirdPartyIds.length > 0 
            ? forkJoin(thirdPartyIds.map(id => this.cashReceiptService.getClientById(id)))
            : of([]) // Si no hay terceros, devolvemos array vacío
        }).pipe(
          map(({ entry, accounts, thirdParties }) => {
            const accountsMap = new Map(accounts.map(acc => [acc.value, acc]));
            const thirdPartiesMap = new Map(thirdParties.filter(tp => !!tp).map(tp => [tp!.id, tp!]));

            const enrichedMovements: AccountingMovementView[] = entry.movements.map(movement => {
              const accountInfo = accountsMap.get(movement.account);
              const thirdPartyInfo = thirdPartiesMap.get(movement.thirdPartyId);

              return {
                id: movement.id,
                accountId: movement.account,
                accountCode: accountInfo?.codeAccount || 'N/A',
                accountName: accountInfo?.description || 'Cuenta no encontrada',
                thirdPartyId: movement.thirdPartyId,
                thirdPartyName: thirdPartyInfo?.name || 'Tercero no encontrado',
                description: movement.description,
                debit: movement.debit,
                credit: movement.credit,
              };
            });

            const totalDebit = enrichedMovements.reduce((sum, m) => sum + m.debit, 0);
            const totalCredit = enrichedMovements.reduce((sum, m) => sum + m.credit, 0);

            const entryView: AccountingEntryView = {
              id: entry.id,
              code: entry.code,
              date: entry.date,
              description: entry.description,
              status: entry.status,
              sourceDocumentId: entry.sourceDocumentId,
              movements: enrichedMovements,
              totalDebit,
              totalCredit
            };

            return entryView;
          })
        );
      })
    );
  }
}
