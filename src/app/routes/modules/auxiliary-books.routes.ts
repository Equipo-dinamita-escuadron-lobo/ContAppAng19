import { Routes } from '@angular/router';
import { hasRoleChildGuard } from '../../Core/Guards/has-role.guard';

export const AUXILIARY_BOOKS_ROUTES: Routes = [
  {
    path: 'list',
    pathMatch: 'full',
    data: {
      breadcrumb: null,
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/auxiliary-books-list/auxiliary-books-list.component').then(
        (m) => m.AuxiliaryBooksListComponent
      ),
  },
  {
    path: 'historial',
    canActivate: [hasRoleChildGuard],
    data: {
      breadcrumb: 'Historial',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/auxiliary-books-historial/auxiliary-books-historial.component').then(
        (m) => m.AuxiliaryBooksHistorialComponent
      ),
  },
  {
    path: 'historial/details/:id',
    canActivate: [hasRoleChildGuard],
    data: {
      breadcrumb: 'Detalles del Historial',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/auxiliary-books-historial/Components/auxiliary-books-details/auxiliary-books-details.component').then(
        (m) => m.AuxiliaryBooksDetailsComponent
      ),
  },
  {
    path: 'inventory-and-balances',
    data: {
      breadcrumb: 'Libro de Inventario y Balances',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component').then(
        (m) => m.InventoryAndBalancesComponent
      ),
  },
  {
    path: 'diary',
    data: {
      breadcrumb: 'Libro Diario',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/diary/diary.component').then(
        (m) => m.DiaryComponent
      ),
  },
  {
    path: 'major-and-balances',
    data: {
      breadcrumb: 'Libro Mayor y Balances',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/major-and-balances/major-and-balances.component').then(
        (m) => m.MajorAndBalancesComponent
      ),
  },
  {
    path: 'account-book',
    data: {
      breadcrumb: 'Libro Auxiliary por Cuenta',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/account-book/account-book.component').then(
        (m) => m.AccountBookComponent
      ),
  },
  {
    path: 'third-party-book',
    data: {
      breadcrumb: 'Libro Auxiliar por Tercero',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/third-party-book/third-party-book.component').then(
        (m) => m.ThirdPartyBookComponent
      ),
  },
  {
    path: 'accounting-movement',
    data: {
      breadcrumb: 'Movimiento de Contabilidad',
    },
    loadComponent: () =>
      import('../../Financial/Reports/auxiliary-books/Components/aux-book-types/accounting-movement/accounting-movement.component').then(
        (m) => m.AccountingMovementComponent
      ),
  },
];
