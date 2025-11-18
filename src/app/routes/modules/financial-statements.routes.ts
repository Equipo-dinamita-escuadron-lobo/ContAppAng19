import { Routes } from '@angular/router';

export const FINANCIAL_STATEMENTS_ROUTES: Routes = [
  {
    path: 'list',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../../Financial/Reports/financial-statements/Components/financial-statements-list/financial-statements-list.component').then(
        (m) => m.FinancialStatementsListComponent
      ),
  },
];
