import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { BillingProduct } from '../models/billing-sale-invoice.model';
import { BillingProductCatalog } from './billing-product-catalog';

// Catálogo con datos quemados, mientras Facturación no se conecta al inventario real.
// Para usar los productos reales: en billing.routes.ts cambiar a InventoryBillingProductCatalog.
@Injectable()
export class MockBillingProductCatalog extends BillingProductCatalog {
  private readonly products: BillingProduct[] = [
    { id: 'p1', code: 'CUA-001', name: 'Cuaderno argollado 100 hojas', priceCents: 850000, ivaPct: 19 },
    { id: 'p2', code: 'PAP-001', name: 'Resma de papel carta', priceCents: 1890000, ivaPct: 19 },
    { id: 'p3', code: 'LAP-001', name: 'Caja de lápices x12', priceCents: 1250000, ivaPct: 19 },
    { id: 'p4', code: 'MAR-001', name: 'Marcador permanente', priceCents: 320000, ivaPct: 19 },
    { id: 'p5', code: 'CAR-001', name: 'Carpeta legajadora', priceCents: 480000, ivaPct: 19 },
    { id: 'p6', code: 'BOL-001', name: 'Bolígrafo azul x10', priceCents: 1500000, ivaPct: 19 },
  ];

  getProducts(): Observable<BillingProduct[]> {
    return of(this.products);
  }
}
