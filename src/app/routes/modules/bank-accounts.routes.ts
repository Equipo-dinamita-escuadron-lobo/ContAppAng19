import { Routes } from '@angular/router';

export const BANK_ACCOUNTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'list',
  },
  {
    path: 'list',
    data: { breadcrumb: null },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-accounts-list/bank-accounts-list.component').then(
        (m) => m.BankAccountsListComponent
      ),
  },
  {
    path: 'create',
    data: { breadcrumb: 'Crear Cuenta Bancaria' },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-accounts-creation/bank-accounts-creation.component').then(
        (m) => m.BankAccountsCreationComponent
      ),
  },
  {
    path: 'edit/:id',
    data: { breadcrumb: 'Editar Cuenta Bancaria' },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-accounts-edit/bank-accounts-edit.component').then(
        (m) => m.BankAccountsEditComponent
      ),
  },
  {
    path: 'banks',
    data: { breadcrumb: 'Bancos' },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-list/bank-list.component').then(
        (m) => m.BankListComponent
      ),
  },
  {
    path: 'banks/create',
    data: { breadcrumb: 'Crear Banco' },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-creation/bank-creation.component').then(
        (m) => m.BankCreationComponent
      ),
  },
  {
    path: 'banks/edit/:id',
    data: { breadcrumb: 'Editar Banco' },
    loadComponent: () =>
      import('../../GeneralMasters/BankAccounts/components/bank-edit/bank-edit.component').then(
        (m) => m.BankEditComponent
      ),
  },
];
