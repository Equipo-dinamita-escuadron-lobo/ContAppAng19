//Representa una línea del asiento contable
export interface AccountingEntryLine {
    accountCode: string;
    accountName: string;
    thirdPartyId: number;
    debit: number;
    credit: number;
    description: string;
}