import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const TAXES_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/Taxes/components/ListTax/list-tax.component').then(
        (m) => m.ListTaxComponent,
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Impuesto' },
    loadComponent: () =>
      import('../../GeneralMasters/Taxes/components/CreateTax/create-tax.component').then(
        (m) => m.CreateTaxComponent,
      ),
    canActivate: [hasPermissionGuard(['T#C'])],
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Impuesto' },
    loadComponent: () =>
      import('../../GeneralMasters/Taxes/components/EditTax/edit-tax.component').then(
        (m) => m.EditTaxComponent,
      ),
    canActivate: [hasPermissionGuard(['T#U'])],
  },
];
