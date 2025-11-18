import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../Core/Guards/has-permission.guard';

export const GENERAL_MASTERS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
  {
    path: 'menu',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../GeneralMasters/Components/MenuCards/menu.component').then(
        (m) => m.MenuComponent
      ),
  },
  {
    path: 'account-catalogue',
    data: {
      breadcrumb: 'Catálogo de Cuentas',
    },
    loadComponent: () =>
      import('../GeneralMasters/AccountCatalogue/components/account-list/account-list.component').then(
        (m) => m.AccountListComponent
      ),
  },
  {
    path: 'cost-centers',
    data: {
      breadcrumb: 'Centros de Costo',
    },
    loadComponent: () =>
      import('../GeneralMasters/CostCenters/components/cost-centers-list/cost-centers-list.component').then(
        (m) => m.CostCentersListComponent
      ),
  },
  {
    path: 'third-parties',
    data: {
      breadcrumb: 'Terceros',
    },
    loadChildren: () =>
      import('../routes/modules/third-parties.routes').then((m) => m.THIRD_PARTIES_ROUTES),
  },
  {
    path: 'no-commercial-tags',
    data: { breadcrumb: 'Etiquetas no comerciales' },
    loadChildren: () =>
      import('../routes/modules/no-commercial-tags.routes').then((m) => m.NO_COMMERCIAL_TAGS_ROUTES),
  },
  {
    path: 'taxes',
    data: { breadcrumb: 'Impuestos' },
    loadChildren: () =>
      import('../routes/modules/taxes.routes').then((m) => m.TAXES_ROUTES),
  },
  {
    path: 'inventory',
    data: { breadcrumb: 'Inventario' },
    loadChildren: () =>
      import('../routes/modules/inventory.routes').then((m) => m.INVENTORY_ROUTES),
  },
  {
    path: 'payment-methods',
    data: { breadcrumb: 'Métodos de Pago' },
    loadChildren: () =>
      import('../routes/modules/payment-methods.routes').then((m) => m.PAYMENT_METHODS_ROUTES),
  },
  {
    path: 'document-types',
    data: { breadcrumb: 'Tipos de Documentos' },
    loadChildren: () =>
      import('../routes/modules/document-types.routes').then((m) => m.DOCUMENT_TYPES_ROUTES),
  },
  {
    path: 'bank-accounts',
    data: { breadcrumb: 'Bancos y Cuentas Bancarias' },
    loadChildren: () =>
      import('../routes/modules/bank-accounts.routes').then((m) => m.BANK_ACCOUNTS_ROUTES),
  },
  {
    path: 'help-center',
    data: { breadcrumb: 'Centro de Ayuda' },
    loadChildren: () =>
      import('../routes/modules/help-center.routes').then((m) => m.HELP_CENTER_ROUTES),
  },
  {
    path: 'accounting-calendar',
    data: { breadcrumb: 'Calendario Contable' },
    loadComponent: () =>
      import('../GeneralMasters/AccountingCalendar/components/accounting-calendar/accounting-calendar.component').then(
        (m) => m.AccountingCalendarComponent
      ),
  },
];
