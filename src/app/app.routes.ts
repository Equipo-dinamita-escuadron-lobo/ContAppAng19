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
    path: 'enterprise/edit',
    data: {
      breadcrumb: 'enterprise-edit',
    },
    loadComponent: () =>
      import('./GeneralMasters/Enterprise/edit-enterprise/edit-enterprise.component').then(
        (m) => m.EditEnterpriseComponent
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
        path: 'gen-masters',
        data: {
          breadcrumb: 'Maestros Generales',
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
                './GeneralMasters/Components/MenuCards/menu.component'
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
          // Rutas de Impuestos
          {
            path: 'taxes',
            data: { breadcrumb: 'Impuestos' },
            children: [
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import('./GeneralMasters/Taxes/components/ListTax/list-tax.component')
                    .then((m) => m.ListTaxComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Impuesto' },
                loadComponent: () =>
                  import('./GeneralMasters/Taxes/components/CreateTax/create-tax.component')
                    .then((m) => m.CreateTaxComponent),
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Editar Impuesto' },
                loadComponent: () =>
                  import('./GeneralMasters/Taxes/components/EditTax/edit-tax.component')
                    .then((m) => m.EditTaxComponent),
              },
            ],
          },
          {
            path: 'inventory',
            data: { breadcrumb: 'Inventario' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'payment-methods',
            data: { breadcrumb: 'Métodos de Pago' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'document-types',
            data: { breadcrumb: 'Tipos de Documentos' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
          },

          {
            path: 'bank-accounts',
            data: { breadcrumb: 'Banco y Cuentas Bancarias' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
          },
          {
            path: 'cost-centers',
            data: { breadcrumb: 'Centros de Costo' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
          },

          {
            path: 'help-panels',
            data: { breadcrumb: 'Centro de Ayuda' },
            loadComponent: () =>
              import('./GeneralMasters/Components/MenuCards/menu.component').then((m) => m.MenuComponent),
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
              {
                path: 'categories',
                data: { breadcrumb: 'Categorías' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () => import('./Commercial/BusinessMasters/Category/Components/category-list/category-list.component').then(m => m.CategoryListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Categoría' },
                    loadComponent: () => import('./Commercial/BusinessMasters/Category/Components/category-creation/category-creation.component').then(m => m.CategoryCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Categoría' },
                    loadComponent: () => import('./Commercial/BusinessMasters/Category/Components/category-edit/category-edit.component').then(m => m.CategoryEditComponent),
                  }
                ]
              },
              {
                path: 'product-types',
                data: { breadcrumb: 'Tipos de Productos' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () => import('./Commercial/BusinessMasters/ProductTypes/Components/product-type-list/product-type-list.component').then(m => m.ProductTypeListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Tipo de Producto' },
                    loadComponent: () => import('./Commercial/BusinessMasters/ProductTypes/Components/product-type-creation/product-type-creation.component').then(m => m.ProductTypeCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Tipo de Producto' },
                    loadComponent: () => import('./Commercial/BusinessMasters/ProductTypes/Components/product-type-edit/product-type-edit.component').then(m => m.ProductTypeEditComponent),
                  }
                ]
              },
              {
                path: 'measurement-units',
                data: { breadcrumb: 'Unidades de Medida' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () => import('./Commercial/BusinessMasters/MeasurementUnits/Components/unit-of-measure-list/unit-of-measure-list.component').then(m => m.UnitOfMeasureListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Unidad de Medida' },
                    loadComponent: () => import('./Commercial/BusinessMasters/MeasurementUnits/Components/unit-of-measure-creation/unit-of-measure-creation.component').then(m => m.UnitOfMeasureCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Unidad de Medida' },
                    loadComponent: () => import('./Commercial/BusinessMasters/MeasurementUnits/Components/unit-of-measure-edit/unit-of-measure-edit.component').then(m => m.UnitOfMeasureEditComponent),
                  }
                ]
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
