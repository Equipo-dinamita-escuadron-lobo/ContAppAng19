import { Routes } from '@angular/router';
import { hasPermissionGuard } from '../../Core/Guards/has-permission.guard';

export const PAYMENT_METHODS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/PaymentMethods/components/payment-methods-list/payment-methods-list.component').then(
        (m) => m.PaymentMethodsListComponent,
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Método de Pago' },
    loadComponent: () =>
      import('../../GeneralMasters/PaymentMethods/components/payment-methods-creation/payment-methods-creation.component').then(
        (m) => m.PaymentMethodsCreationComponent,
      ),
    canActivate: [hasPermissionGuard(['PM#C'])],
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Método de Pago' },
    loadComponent: () =>
      import('../../GeneralMasters/PaymentMethods/components/payment-methods-edit/payment-methods-edit.component').then(
        (m) => m.PaymentMethodsEditComponent,
      ),
    canActivate: [hasPermissionGuard(['PM#U'])],
  },
];
