import { Observable } from 'rxjs';
import { BillingProduct } from '../models/billing-sale-invoice.model';

// Contrato del catálogo de productos que usa Facturación. Se usa como token de DI
// (igual que BillingSaleInvoiceApi): billing.routes.ts decide la implementación.
export abstract class BillingProductCatalog {
  /** Productos activos disponibles para facturar, con precio/IVA de catálogo. */
  abstract getProducts(): Observable<BillingProduct[]>;
}
