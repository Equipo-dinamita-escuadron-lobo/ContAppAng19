import { Injectable, inject } from '@angular/core';
import { Observable, defer, delay, of, switchMap } from 'rxjs';
import {
  BillingClient,
  BillingProduct,
  InvoiceStatus,
  SaleInvoice,
  SaleInvoiceDraftInput,
} from '../models/billing-sale-invoice.model';
import { BillingProductCatalog } from './billing-product-catalog';
import { BillingSaleInvoiceApi } from './billing-sale-invoice.api';

const INVOICES_KEY = 'billing_sale_invoices';
const SEQUENCE_KEY = 'billing_sale_invoice_seq';
const LATENCY_MS = 200;

const MOCK_CLIENTS: BillingClient[] = [
  { id: 'c1', name: 'Distribuidora El Dorado S.A.S.', document: 'NIT 900.123.456-7' },
  { id: 'c2', name: 'Papelería Central Ltda.', document: 'NIT 800.987.654-3' },
  { id: 'c3', name: 'María Fernanda Ortiz', document: 'CC 1.061.234.567' },
  { id: 'c4', name: 'Comercializadora Andina S.A.', document: 'NIT 901.555.222-1' },
];

// Implementación simulada: persiste en localStorage y responde con una latencia pequeña.
// Las escrituras ocurren de forma síncrona al llamar, así un guardado disparado al
// destruir el componente no se pierde aunque nadie espere la respuesta.
@Injectable()
export class MockBillingSaleInvoiceApi extends BillingSaleInvoiceApi {
  // Las referencias de catálogo de cada línea se resuelven con el catálogo real de productos
  private readonly catalog = inject(BillingProductCatalog);

  getClients(): Observable<BillingClient[]> {
    return of(structuredClone(MOCK_CLIENTS)).pipe(delay(LATENCY_MS));
  }

  list(status?: InvoiceStatus): Observable<SaleInvoice[]> {
    return defer(() => {
      const all = this.readAll()
        .filter((i) => !status || i.status === status)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return of(all).pipe(delay(LATENCY_MS));
    });
  }

  getById(id: string): Observable<SaleInvoice> {
    return defer(() => of(this.findOrThrow(this.readAll(), id)).pipe(delay(LATENCY_MS)));
  }

  saveDraft(input: SaleInvoiceDraftInput): Observable<SaleInvoice> {
    const catalog$ = input.lines.length > 0 ? this.catalog.getProducts() : of<BillingProduct[]>([]);
    return catalog$.pipe(switchMap((catalog) => this.writeDraft(input, catalog)));
  }

  private writeDraft(input: SaleInvoiceDraftInput, catalog: BillingProduct[]): Observable<SaleInvoice> {
    return defer(() => {
      const all = this.readAll();
      const now = new Date().toISOString();
      const client = MOCK_CLIENTS.find((c) => c.id === input.clientId);

      let invoice: SaleInvoice;
      if (input.id) {
        invoice = this.findOrThrow(all, input.id);
        this.assertDraft(invoice);
      } else {
        invoice = {
          id: crypto.randomUUID(),
          number: null,
          status: 'BORRADOR',
          clientId: null,
          clientName: null,
          date: input.date,
          lines: [],
          createdAt: now,
          updatedAt: now,
        };
        all.push(invoice);
      }

      invoice.clientId = client?.id ?? null;
      invoice.clientName = client?.name ?? null;
      invoice.date = input.date;
      const previousLines = invoice.lines;
      invoice.lines = input.lines.map((l) => {
        const product = catalog.find((p) => p.id === l.productId);
        // Un producto que ya estaba en el borrador pero hoy no está en el catálogo activo
        // (desactivado/eliminado o dato legacy del mock) conserva sus referencias previas.
        const previous = previousLines.find((p) => p.productId === l.productId);
        if (!product && !previous) throw new Error(`El producto ${l.productName} no existe.`);
        if (!Number.isFinite(l.ivaPct) || l.ivaPct < 0 || l.ivaPct > 100) {
          throw new Error('El IVA debe estar entre 0 y 100.');
        }
        return {
          productId: l.productId,
          productName: l.productName,
          cantidad: l.cantidad,
          precioUnitarioCents: l.precioUnitarioCents,
          ivaPct: l.ivaPct, // efectivo: prevalece el del usuario
          // referencias: siempre del producto (del catálogo si existe)
          precioCatalogoCents: product ? product.priceCents : previous!.precioCatalogoCents,
          ivaCatalogoPct: product ? product.ivaPct : previous!.ivaCatalogoPct,
        };
      });
      invoice.updatedAt = now;

      this.writeAll(all);
      return of(structuredClone(invoice)).pipe(delay(LATENCY_MS));
    });
  }

  deleteDraft(id: string): Observable<void> {
    return defer(() => {
      const all = this.readAll();
      this.assertDraft(this.findOrThrow(all, id));
      this.writeAll(all.filter((i) => i.id !== id));
      return of(void 0).pipe(delay(LATENCY_MS));
    });
  }

  emit(id: string): Observable<SaleInvoice> {
    return defer(() => {
      const all = this.readAll();
      const invoice = this.findOrThrow(all, id);
      this.assertDraft(invoice);

      // Las mismas reglas que validará el backend real
      if (!invoice.clientId) throw new Error('Debes seleccionar un cliente.');
      if (invoice.lines.length === 0) throw new Error('La factura debe tener al menos una línea.');
      if (invoice.lines.some((l) => !(l.cantidad > 0))) {
        throw new Error('Todas las líneas deben tener cantidad mayor a cero.');
      }

      const now = new Date().toISOString();
      invoice.number = this.nextNumber();
      invoice.status = 'EMITIDA';
      invoice.emittedAt = now;
      invoice.updatedAt = now;

      this.writeAll(all);
      return of(structuredClone(invoice)).pipe(delay(LATENCY_MS));
    });
  }

  annul(id: string, reason: string): Observable<SaleInvoice> {
    return defer(() => {
      const all = this.readAll();
      const invoice = this.findOrThrow(all, id);
      if (invoice.status !== 'EMITIDA') throw new Error('Solo se pueden anular facturas emitidas.');
      if (!reason?.trim()) throw new Error('El motivo de anulación es obligatorio.');

      const now = new Date().toISOString();
      invoice.status = 'ANULADA';
      invoice.annulReason = reason.trim();
      invoice.annulledAt = now;
      invoice.updatedAt = now;

      this.writeAll(all);
      return of(structuredClone(invoice)).pipe(delay(LATENCY_MS));
    });
  }

  // --- helpers de persistencia ---

  private readAll(): SaleInvoice[] {
    try {
      const invoices = JSON.parse(localStorage.getItem(INVOICES_KEY) ?? '[]') as SaleInvoice[];
      // Migración: facturas guardadas antes de existir ivaCatalogoPct
      for (const inv of invoices) {
        for (const line of inv.lines) {
          line.ivaCatalogoPct ??= line.ivaPct;
        }
      }
      return invoices;
    } catch {
      return [];
    }
  }

  private writeAll(invoices: SaleInvoice[]): void {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  }

  private nextNumber(): string {
    const next = Number(localStorage.getItem(SEQUENCE_KEY) ?? '0') + 1;
    localStorage.setItem(SEQUENCE_KEY, String(next));
    return `FV-${String(next).padStart(6, '0')}`;
  }

  private findOrThrow(all: SaleInvoice[], id: string): SaleInvoice {
    const invoice = all.find((i) => i.id === id);
    if (!invoice) throw new Error('La factura no existe.');
    return invoice;
  }

  private assertDraft(invoice: SaleInvoice): void {
    if (invoice.status !== 'BORRADOR') {
      throw new Error('Solo los borradores se pueden modificar o eliminar.');
    }
  }
}
