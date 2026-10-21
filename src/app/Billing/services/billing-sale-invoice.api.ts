import { Observable } from 'rxjs';
import {
  BillingClient,
  InvoiceStatus,
  SaleInvoice,
  SaleInvoiceDraftInput,
} from '../models/billing-sale-invoice.model';

// Contrato de acceso a datos de facturas de venta. Se usa como token de DI:
// para pasar de mock a HTTP basta cambiar el `useClass` en billing.routes.ts.
export abstract class BillingSaleInvoiceApi {
  abstract getClients(): Observable<BillingClient[]>;

  abstract list(status?: InvoiceStatus): Observable<SaleInvoice[]>;
  abstract getById(id: string): Observable<SaleInvoice>;

  /** Crea o actualiza un borrador (solo válido mientras esté en BORRADOR). */
  abstract saveDraft(input: SaleInvoiceDraftInput): Observable<SaleInvoice>;
  abstract deleteDraft(id: string): Observable<void>;

  /** BORRADOR -> EMITIDA: valida y asigna el número consecutivo. */
  abstract emit(id: string): Observable<SaleInvoice>;
  /** EMITIDA -> ANULADA: requiere motivo. */
  abstract annul(id: string, reason: string): Observable<SaleInvoice>;
}
