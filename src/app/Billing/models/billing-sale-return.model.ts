// Modelos de la devolución de venta. Una devolución es UN solo documento: también hace
// de nota crédito (número NC-). Los montos se guardan en CENTAVOS (enteros).

import { InvoiceStatus } from './billing-sale-invoice.model';

// Estado de devolución de una factura. Se CALCULA (ver utils/sale-return.ts), nunca se guarda.
export type InvoiceReturnState = 'SIN_DEVOLUCION' | 'PARCIAL' | 'TOTAL';

export interface SaleReturnLine {
  productId: string;
  productName: string;
  cantidadVendida?: number; // snapshot de lo vendido en la factura original
  cantidadDevuelta: number;
  precioUnitarioCents: number; // congelado de la línea original
  ivaPct: number; // congelado de la línea original
}

export interface SaleReturn {
  id: string;
  number: string | null; // null mientras sea borrador; se asigna al emitir (NC-000001...)
  status: InvoiceStatus; // mismo ciclo de vida que la factura
  invoiceId: string;
  originalNumber: string | null; // snapshot del número de la factura original
  originalDate: string; // yyyy-MM-dd de la factura original (snapshot)
  clientId: string | null;
  clientName: string | null;
  date: string; // yyyy-MM-dd
  reason: string;
  lines: SaleReturnLine[];
  createdAt: string;
  updatedAt: string;
  emittedAt?: string;
  annulledAt?: string;
  annulReason?: string;
}

// Disponibilidad de devolución por producto de la factura original
export interface ReturnAvailabilityLine {
  productId: string;
  productName: string;
  sold: number;
  returned: number; // suma de devoluciones EMITIDA
  available: number; // sold - returned
  precioUnitarioCents: number;
  ivaPct: number;
}

// Lo que el front envía al guardar un borrador (crea si no hay id)
export interface SaleReturnDraftInput {
  id?: string;
  invoiceId: string;
  date: string;
  reason: string;
  lines: { productId: string; cantidad: number }[];
}

// Fila del listado "Facturas con devolución"
export interface InvoiceWithReturnsSummary {
  invoiceId: string;
  invoiceNumber: string | null;
  clientName: string | null;
  invoiceDate: string;
  invoiceTotalCents: number;
  returnsCount: number; // devoluciones EMITIDA
  returnedTotalCents: number;
  state: InvoiceReturnState;
}
