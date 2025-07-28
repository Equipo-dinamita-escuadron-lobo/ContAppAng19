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
    path: 'enterprise/create',
    data: {
      breadcrumb: 'enterprise-create',
    },
    loadComponent: () =>
      import('./GeneralMasters/Enterprise/create-enterprise/create-enterprise.component').then(
        (m) => m.CreateEnterpriseComponent
      ),
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
        path: 'configuration',
        data: { breadcrumb: 'Configuración' },
        children: [
          {
            path: '',
            pathMatch: 'full',
            data: {
              breadcrumb: null,
            },
            loadComponent: () =>
              import(
                './Configuration/Components/configuration-main/configuration-main.component'
              ).then((m) => m.ConfigurationMainComponent),
          },
          {
            path: 'users/list',
            data: { breadcrumb: 'Usuarios' },
            loadComponent: () =>
              import(
                './Configuration/Users/Components/user-list/user-list.component'
              ).then((m) => m.UserListComponent),
            canActivate: [hasRoleGuard(['admin_realm'])],
          },
          {
            path: 'users/create',
            data: { breadcrumb: 'Crear usuario' },
            loadComponent: () =>
              import(
                './Configuration/Users/Components/user-create/user-create.component'
              ).then((m) => m.UserCreateComponent),
            canActivate: [hasRoleGuard(['admin_realm'])],
          },
          {
            path: 'users/edit/:id',
            data: { breadcrumb: 'Editar usuario' },
            loadComponent: () =>
              import(
                './Configuration/Users/Components/user-edit/user-edit.component'
              ).then((m) => m.UserEditComponent),
            canActivate: [hasRoleGuard(['admin_realm'])],
          },
          {
            path: 'profiles/list',
            data: {
              breadcrumb: 'Gestión de Perfiles',
            },
            loadComponent: () =>
              import(
                './Configuration/Profiles/Components/profile-list/profile-list.component'
              ).then((m) => m.ProfileListComponent),
            canActivate: [hasRoleGuard(['admin_realm'])],
          },
        ],
      },
      {
        path: 'home',
        component: ViewEnterpriseComponent,
      },
      {
        path: 'general-configuration',
        data: {
          breadcrumb: 'Configuración General',
        },
        children: [
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
              import(
                './GeneralConfiguration/Components/menu/menu.component'
              ).then((m) => m.MenuComponent),
          },
          {
            path: 'account-catalogue',
            data: {
              breadcrumb: 'Catálogo de Cuentas',
            },
            loadComponent: () =>
              import(
                './GeneralMasters/AccountCatalogue/components/account-list/account-list.component'
              ).then((m) => m.AccountListComponent),
          },
          {
            path: 'third-parties',
            data: {
              breadcrumb: 'Terceros',
            },
            loadComponent: () =>
              import(
                './GeneralMasters/ThirdParties/Components/third-parties-list/third-parties-list.component'
              ).then((m) => m.ThirdPartiesListComponent),
          },
          // Rutas de Impuestos
          {
            path: 'taxes',
            data: { breadcrumb: 'Impuestos' },
            children: [
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import('./GeneralConfiguration/Taxes/components/list-tax/list-tax.component')
                    .then((m) => m.ListTaxComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Impuesto' },
                loadComponent: () =>
                  import('./GeneralConfiguration/Taxes/components/create-tax/create-tax.component')
                    .then((m) => m.CreateTaxComponent),
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Editar Impuesto' },
                loadComponent: () =>
                  import('./GeneralConfiguration/Taxes/components/edit-tax/edit-tax.component')
                    .then((m) => m.EditTaxComponent),
              },
            ],
          },
          {
            path: 'inventory',
            data: { breadcrumb: 'Inventario' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'payment-methods',
            data: { breadcrumb: 'Métodos de Pago' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'document-types',
            data: { breadcrumb: 'Tipos de Documentos' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'document-statuses',
            data: { breadcrumb: 'Estados de Documentos' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'bank-accounts',
            data: { breadcrumb: 'Banco y Cuentas Bancarias' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'cost-centers',
            data: { breadcrumb: 'Centros de Costo' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'aged-receivables',
            data: { breadcrumb: 'Edades Cartera' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'help-panels',
            data: { breadcrumb: 'Cuadros de Diálogo' },
            loadComponent: () =>
              import('./GeneralConfiguration/Components/menu/menu.component').then((m) => m.MenuComponent),
          },
        ],
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
            path: 'business-masters',
            data: {
              breadcrumb: 'Maestros Comerciales',
            },
            children: [
              {
                path: 'kardex',
                data: {
                  breadcrumb: 'Kardex',
                },
                loadComponent: () =>
                  import(
                    './Commercial/BusinessMasters/ValuationModels/WeightedAverage/list-kardex-weighted-average/list-kardex-weighted-average.component'
                  ).then((m) => m.ListKardexWeightedAverageComponent),
              },
            ],
          },
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
            children: [
              {
                path: 'list',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './Commercial/BusinessMasters/Products/Components/product-list/product-list.component'
                  ).then((m) => m.ProductListComponent),
              },
              {
                path: 'create',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './Commercial/BusinessMasters/Products/Components/product-creation/product-creation.component'
                  ).then((m) => m.ProductCreationComponent),
              },
              {
                path: 'edit/:id',
                data: {
                  breadcrumb: null,
                },
                loadComponent: () =>
                  import(
                    './Commercial/BusinessMasters/Products/Components/product-edit/product-edit.component'
                  ).then((m) => m.ProductEditComponent),
              }
            ],
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
