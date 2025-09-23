/**
 * Representa una única línea (débito o crédito) dentro de un asiento contable.
 * Utilizado para mostrar el comprobante contable de un recibo.
 */
export interface AccountingEntryLine {
  accountCode: string;
  accountName: string;
  thirdPartyId: number;
  debit: number;
  credit: number;
  description: string;

  // Nueva propiedad para la factura asociada, si aplica
  associatedInvoice?: {
    invoiceNumber: string;
    amountCredited: number;
  };
}
