import { Routes } from '@angular/router';
import { hasRoleChildGuard } from '../../Core/Guards/has-role.guard';

export const FINANCIAL_REPORTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../../Financial/Reports/Components/main-view/main-view.component').then(
        (m) => m.MainViewComponent
      ),
  },
  {
    path: 'auxiliary-books',
    data: {
      breadcrumb: 'Libros Auxiliares',
    },
    loadChildren: () =>
      import('../modules/auxiliary-books.routes').then((m) => m.AUXILIARY_BOOKS_ROUTES),
  },
  {
    path: 'financial-statements',
    data: {
      breadcrumb: 'Estados Financieros',
    },
    loadChildren: () =>
      import('../modules/financial-statements.routes').then((m) => m.FINANCIAL_STATEMENTS_ROUTES),
  },
];
