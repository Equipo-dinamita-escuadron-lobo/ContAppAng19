import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
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
      import('../Billing/components/billing-placeholder/billing-placeholder.component').then(
        (m) => m.BillingPlaceholderComponent,
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
      import('../Billing/components/billing-placeholder/billing-placeholder.component').then(
        (m) => m.BillingPlaceholderComponent,
      ),
  },
  {
    path: 'list',
    data: { breadcrumb: 'Ver Facturas', title: 'Ver facturas' },
    loadComponent: () =>
      import('../Billing/components/billing-placeholder/billing-placeholder.component').then(
        (m) => m.BillingPlaceholderComponent,
      ),
  },
];
