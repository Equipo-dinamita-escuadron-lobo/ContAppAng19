import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';
import { ListEnterpriseComponent } from './GeneralMasters/Enterprise/list-enterprise/list-enterprise.component';
import { hasRoleGuard } from './Core/Guards/has-role.guard';
import { MainTemplateComponent } from './Core/Components/MainTemplate/main-template.component';
import { ViewEnterpriseComponent } from './GeneralMasters/Enterprise/view-enterprise/view-enterprise.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'enterprise/list',
    data: {
      breadcrumb: 'enterprise-list',
    },
    component: ListEnterpriseComponent,
    canActivate: [hasRoleGuard(['admin_realm'])],
  },
  {
    path: '',
    component: MainTemplateComponent,
    canActivate: [hasRoleGuard(['admin_realm', 'user_realm', 'super_realm'])],
    data: {
      breadcrumb: 'Home',
    },
    children: [
      {
        path: 'home',
        component: ViewEnterpriseComponent,
      },
      {
        path: 'gen-masters',
        data: {
          breadcrumb: 'Maestros Generales',
        },
        children: [
          {
            path: 'third-parties',
            data: {
              breadcrumb: 'Terceros',
            },
            children: [
              {
                path: 'list',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './GeneralMasters/ThirdParties/Components/third-parties-list/third-parties-list.component'
                  ).then((m) => m.ThirdPartiesListComponent),
              },
              {
                path: 'create',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './GeneralMasters/ThirdParties/Components/third-parties-create/third-parties-create.component'
                  ).then((m) => m.ThirdPartiesCreateComponent),
              },
              {
                path: 'edit/:id',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './GeneralMasters/ThirdParties/Components/third-parties-edit/third-parties-edit.component'
                  ).then((m) => m.ThirdPartiesEditComponent),
              },
            ],
          },
          {
            path: 'catalogue-accounts',
            data: {
              breadcrumb: 'Catálogo de cuentas',
            },
            loadComponent: () =>
              import(
                './GeneralMasters/AccountCatalogue/components/account-list/account-list.component'
              ).then((m) => m.AccountListComponent),
          },
        ],
      },
      {
        path: 'financial',
        data: {
          breadcrumb: 'Módulo Financiero',
        },
        children: [
          {
            path: 'reports',
            data: {
              breadcrumb: 'Reportes',
            },
            children: [
              {
                path: '',
                pathMatch: 'full',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './Financial/Reports/Components/main-view/main-view.component'
                  ).then((m) => m.MainViewComponent),
              },
              {
                path: 'auxiliary-books/list',
                data: {
                  breadcrumb: 'Libros Auxiliares',
                },
                loadComponent: () =>
                  import(
                    './Financial/Reports/auxiliary-books/Components/auxiliary-books-list/auxiliary-books-list.component'
                  ).then((m) => m.AuxiliaryBooksListComponent),
              },
            ],
          },
        ],
      },
      {
        path: 'commercial',
        data: {
          breadcrumb: 'Módulo Comercial',
        },
        children: [
          {
            path: 'sale-invoice',
            data: {
              breadcrumb: 'Factura de Venta',
            },
            loadComponent: () =>
              import(
                './Commercial/SaleInvoice/components/sale-invoice-creation/sale-invoice-creation.component'
              ).then((m) => m.SaleInvoiceCreationComponent),
          },
          {
            path: 'products',
            data: {
              breadcrumb: 'Productos',
            },
            loadComponent: () =>
              import(
                './Commercial/BusinessMasters/Products/Components/product-list/product-list.component'
              ).then((m) => m.ProductListComponent),
          },
        ],
      },
    ],
  },
  {
    path: 'style-guide',
    data: {
      breadcrumb: '',
    },
    component: StyleGuideComponent,
  },
];
