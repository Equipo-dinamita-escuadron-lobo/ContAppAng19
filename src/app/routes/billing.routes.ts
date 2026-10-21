import { Routes } from '@angular/router';
import { BillingProductCatalog } from '../Billing/services/billing-product-catalog';
import { MockBillingProductCatalog } from '../Billing/services/mock-billing-product-catalog';
import { BillingSaleInvoiceApi } from '../Billing/services/billing-sale-invoice.api';
import { MockBillingSaleInvoiceApi } from '../Billing/services/mock-billing-sale-invoice.api';

export const BILLING_ROUTES: Routes = [
  {
    path: '',
    // Para pasar a HTTP: cambiar `useClass` por la implementación real (única línea a tocar)
    providers: [
      { provide: BillingSaleInvoiceApi, useClass: MockBillingSaleInvoiceApi },
      // Catálogo con datos quemados. Para usar los productos reales: InventoryBillingProductCatalog
      { provide: BillingProductCatalog, useClass: MockBillingProductCatalog },
    ],
    children: [
      {
        path: '',
        data: { breadcrumb: null },
        loadComponent: () =>
          import('../Billing/components/billing-menu/billing-menu.component').then(
            (m) => m.BillingMenuComponent,
          ),
      },
      {
        path: 'pending',
        data: { breadcrumb: 'Continuar Factura Pendiente', title: 'Continuar factura pendiente' },
        loadComponent: () =>
          import('../Billing/components/sale-invoice-pending/sale-invoice-pending.component').then(
            (m) => m.SaleInvoicePendingComponent,
          ),
      },
      {
        path: 'purchase/new',
        data: { breadcrumb: 'Nueva Factura Compra', title: 'Nueva Factura Compra' },
        loadComponent: () =>
          import('../Billing/components/billing-placeholder/billing-placeholder.component').then(
            (m) => m.BillingPlaceholderComponent,
          ),
      },
      {
        path: 'sale/new',
        data: { breadcrumb: 'Nueva Factura Venta', title: 'Nueva Factura Venta' },
        loadComponent: () =>
          import('../Billing/components/sale-invoice-form/sale-invoice-form.component').then(
            (m) => m.SaleInvoiceFormComponent,
          ),
      },
      {
        path: 'sale/:id',
        data: { breadcrumb: 'Factura Venta', title: 'Factura Venta' },
        loadComponent: () =>
          import('../Billing/components/sale-invoice-form/sale-invoice-form.component').then(
            (m) => m.SaleInvoiceFormComponent,
          ),
      },
      {
        path: 'list',
        data: { breadcrumb: 'Ver Facturas', title: 'Ver facturas' },
        loadComponent: () =>
          import('../Billing/components/sale-invoice-list/sale-invoice-list.component').then(
            (m) => m.SaleInvoiceListComponent,
          ),
      },
    ],
  },
];
