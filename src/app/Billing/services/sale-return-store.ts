import { SaleReturn } from '../models/billing-sale-return.model';

// Acceso compartido al "almacén" localStorage de devoluciones. Lo usan el mock de devoluciones
// y el mock de facturas (para impedir anular una factura con devoluciones emitidas) sin que
// un servicio dependa del otro por DI (evita dependencia circular). Solo para los mocks.

const RETURNS_KEY = 'billing_sale_returns';
const RETURN_SEQUENCE_KEY = 'billing_sale_return_seq';

export function readSaleReturns(): SaleReturn[] {
  try {
    return JSON.parse(localStorage.getItem(RETURNS_KEY) ?? '[]') as SaleReturn[];
  } catch {
    return [];
  }
}

export function writeSaleReturns(returns: SaleReturn[]): void {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(returns));
}

export function nextSaleReturnNumber(): string {
  const next = Number(localStorage.getItem(RETURN_SEQUENCE_KEY) ?? '0') + 1;
  localStorage.setItem(RETURN_SEQUENCE_KEY, String(next));
  return `NC-${String(next).padStart(6, '0')}`;
}

export function hasEmittedReturns(invoiceId: string): boolean {
  return readSaleReturns().some((r) => r.invoiceId === invoiceId && r.status === 'EMITIDA');
}
