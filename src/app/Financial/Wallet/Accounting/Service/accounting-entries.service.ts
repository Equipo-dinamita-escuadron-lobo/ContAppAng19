import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LocalStorageMethods } from '../../../../Shared/Methods/local-storage.method';
import { CashReceiptService } from '../../CashReceipts/Service/cash-receipt.service';
import { AccountingEntryResponse } from '../../CashReceipts/Model/api';
import { environment } from '../../../../../environments/environment';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { AccountingEntryView, AccountingMovementView } from '../../CashReceipts/Model/view';

@Injectable({
  providedIn: 'root'
})
export class AccountingEntriesService {

  private accountingApiUrl = environment.API_URL + 'accountCatalogue/accounting'; // Nuevo URL para asientos contables

  constructor(
    private http: HttpClient,
    private localStorageMethods: LocalStorageMethods,
    private cashReceiptService: CashReceiptService
  ) { }

  /**
   * Obtiene el asiento contable crudo desde la API por ID de origen y tipo.
   * @param sourceDocumentId - El ID del documento fuente (recibo o castigo).
   * @param type - El tipo de documento ('receipt' o 'write-off').
   * @returns Un Observable con la respuesta de la API.
   */

  private getAccountingEntryBySourceApi(sourceDocumentId: number, type: string): Observable<AccountingEntryResponse> {
    return this.http.get<AccountingEntryResponse>(`${this.accountingApiUrl}/entries/by-source/${sourceDocumentId}/${type}`);
  }

  /**
  * ORQUESTADOR: Obtiene el asiento contable por ID y tipo de documento fuente y lo enriquece.
  * @param sourceDocumentId - El ID del documento fuente.
  * @param type - El tipo de documento ('receipt' o 'write-off').
  * @returns Un Observable con el asiento contable listo para la vista.
  */
  getAccountingEntryViewBySource(sourceDocumentId: number, type: string): Observable<AccountingEntryView> {
    const enterpriseId = this.localStorageMethods.getIdEnterprise();
    console.log('Enterprise ID obtenido para obtener asientos contables:', enterpriseId);
    if (!enterpriseId) {
      return of({} as AccountingEntryView); // Manejar error
    }

    // 1. Obtener el asiento contable de la API usando el nuevo método
    return this.getAccountingEntryBySourceApi(sourceDocumentId, type).pipe(
      switchMap(entryApi => {
        // El resto de la lógica de enriquecimiento permanece igual
        const accountIds = [...new Set(entryApi.movements.map(m => m.account))];
        const thirdPartyIds = [...new Set(entryApi.movements.map(m => m.thirdPartyId))];

        console.log(`Cuentas involucradas en el asiento del documento ${sourceDocumentId} (${type}):`, accountIds);

        return forkJoin({
          entry: of(entryApi),
          accounts: this.cashReceiptService.getAuxiliaryAccountsCached(enterpriseId),
          thirdParties: forkJoin(thirdPartyIds.map(id => this.cashReceiptService.getClientById(id)))
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
            console.log("Asiento contable enriquecido:", entryView);
            return entryView;
          })
        );
      })
    );
  }
}
