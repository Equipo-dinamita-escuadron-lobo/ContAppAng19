import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';
import { ListEnterpriseComponent } from './GeneralMasters/Enterprise/list-enterprise/list-enterprise.component';
import { hasRoleGuard } from './Core/Guards/has-role.guard';
import { MainTemplateComponent } from './Core/Components/MainTemplate/main-template.component';
import { ViewEnterpriseComponent } from './GeneralMasters/Enterprise/view-enterprise/view-enterprise.component';
import { Breadcrumb } from 'primeng/breadcrumb';
import { hasPermissionGuard } from './Core/Guards/has-permission.guard';

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
  },
  {
    path: 'enterprise/create',
    data: {
      breadcrumb: 'enterprise-create',
    },
    loadComponent: () =>
      import(
        './GeneralMasters/Enterprise/create-enterprise/create-enterprise.component'
      ).then((m) => m.CreateEnterpriseComponent),
  },
  {
    path: 'enterprise/edit',
    data: {
      breadcrumb: 'enterprise-edit',
    },
    loadComponent: () =>
      import(
        './GeneralMasters/Enterprise/edit-enterprise/edit-enterprise.component'
      ).then((m) => m.EditEnterpriseComponent),
  },
  {
    path: '',
    component: MainTemplateComponent,
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
          },
          {
            path: 'users/create',
            data: { breadcrumb: 'Crear usuario' },
            loadComponent: () =>
              import(
                './Configuration/Users/Components/user-create/user-create.component'
              ).then((m) => m.UserCreateComponent),
          },
          {
            path: 'users/edit/:id',
            data: { breadcrumb: 'Editar usuario' },
            loadComponent: () =>
              import(
                './Configuration/Users/Components/user-edit/user-edit.component'
              ).then((m) => m.UserEditComponent),
          },
          {
            path: 'profiles',
            data: {
              breadcrumb: 'Gestión de Perfiles',
            },
            children: [
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import(
                    './Configuration/Profiles/Components/profile-list/profile-list.component'
                  ).then((m) => m.ProfileListComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Perfil' },
                loadComponent: () =>
                  import(
                    './Configuration/Profiles/Components/profile-create/profile-create.component'
                  ).then((m) => m.ProfileCreateComponent),
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Editar Perfil' },
                loadComponent: () =>
                  import(
                    './Configuration/Profiles/Components/profile-edit/profile-edit.component'
                  ).then((m) => m.ProfileEditComponent),
              },
            ],
          },
          {
            path: 'permissions',
            data: {
              breadcrumb: 'Gestión de Permisos',
            },
            children: [
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import(
                    './Configuration/Permissions/Components/permission-list/permission-list.component'
                  ).then((m) => m.PermissionListComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Permiso' },
                loadComponent: () =>
                  import(
                    './Configuration/Permissions/Components/permission-create/permission-create.component'
                  ).then((m) => m.PermissionCreateComponent),
              },
              {
                path: 'edit/:role',
                data: { breadcrumb: 'Editar Permiso' },
                loadComponent: () =>
                  import(
                    './Configuration/Permissions/Components/permission-edit/permission-edit.component'
                  ).then((m) => m.PermissionEditComponent),
              },
            ],
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
            path: 'cost-centers',
            data: {
              breadcrumb: 'Centros de Costo',
            },
            loadComponent: () =>
              import(
                './GeneralMasters/CostCenters/components/cost-centers-list/cost-centers-list.component'
              ).then((m) => m.CostCentersListComponent),
          },
          {
            path: 'third-parties',
            data: {
              breadcrumb: 'Terceros',
            },
            children: [
              {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full',
              },
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
          //Rutas de etiquetas no comerciales
          {
            path:'no-commercial-tags',
            data:{Breadcrumb:'Etiquetas no comerciales'},
            children:[
              {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full'
              },
              {
                path:'list',
                data:{breadcrumb:null},
                loadComponent:()=>
                  import('./GeneralMasters/noCommercialTags/Components/list-tag/list-tag.component')
                    .then((m)=>m.ListTagComponent),
              },
              {
                path:'create',
                data:{Breadcrumb:'Crear Etiqueta No Comercial'},
                loadComponent: () =>
                  import('./GeneralMasters/noCommercialTags/Components/create-tag/create-tag.component')
                    .then((m)=>m.CreateTagComponent),
              },
              {
                path:'edit/:id',
                data:{Breadcrumb:'Editar Etiqueta No Comercial'},
                loadComponent:()=>
                  import('./GeneralMasters/noCommercialTags/Components/edit-tag/edit-tag.component')
                    .then((m)=>m.EditTagComponent),
              }

            ]
          },
          // Rutas de Impuestos
          {
            path: 'taxes',
            data: { breadcrumb: 'Impuestos' },
            children: [
              {
                path: '',
                redirectTo: 'list',
                pathMatch: 'full',
              },
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import(
                    './GeneralMasters/Taxes/components/ListTax/list-tax.component'
                  ).then((m) => m.ListTaxComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Impuesto' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/Taxes/components/CreateTax/create-tax.component'
                  ).then((m) => m.CreateTaxComponent),
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Editar Impuesto' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/Taxes/components/EditTax/edit-tax.component'
                  ).then((m) => m.EditTaxComponent),
              },
            ],
          },
          {
            path: 'inventory',
            data: { breadcrumb: 'Inventario' },
            children: [
              {
                path: '',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import(
                    './GeneralMasters/Inventory/Components/MenuCards/inventory-menu.component'
                  ).then((m) => m.InventoryMenuComponent),
              },
              {
                path: 'products',
                data: { breadcrumb: 'Productos' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Products/Components/product-list/product-list.component'
                      ).then((m) => m.ProductListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Producto' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Products/Components/product-creation/product-creation.component'
                      ).then((m) => m.ProductCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Producto' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Products/Components/product-edit/product-edit.component'
                      ).then((m) => m.ProductEditComponent),
                  },
                ],
              },
              {
                path: 'product-types',
                data: { breadcrumb: 'Tipos de Productos' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/ProductTypes/Components/product-type-list/product-type-list.component'
                      ).then((m) => m.ProductTypeListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Tipo de Producto' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/ProductTypes/Components/product-type-creation/product-type-creation.component'
                      ).then((m) => m.ProductTypeCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Tipo de Producto' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/ProductTypes/Components/product-type-edit/product-type-edit.component'
                      ).then((m) => m.ProductTypeEditComponent),
                  },
                ],
              },
              {
                path: 'categories',
                data: { breadcrumb: 'Categorías' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Category/Components/category-list/category-list.component'
                      ).then((m) => m.CategoryListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Categoría' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Category/Components/category-creation/category-creation.component'
                      ).then((m) => m.CategoryCreationComponent),
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Categoría' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/Category/Components/category-edit/category-edit.component'
                      ).then((m) => m.CategoryEditComponent),
                  },
                ],
              },
              {
                path: 'measurement-units',
                data: { breadcrumb: 'Unidades de Medida' },
                children: [
                  {
                    path: 'list',
                    data: { breadcrumb: null },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-list/unit-of-measure-list.component'
                      ).then((m) => m.UnitOfMeasureListComponent),
                  },
                  {
                    path: 'create',
                    data: { breadcrumb: 'Crear Unidad de Medida' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-creation/unit-of-measure-creation.component'
                      ).then((m) => m.UnitOfMeasureCreationComponent),
                    canActivate: [
                      hasPermissionGuard(['Create_Unit_of_Measurement']),
                    ],
                  },
                  {
                    path: 'edit/:id',
                    data: { breadcrumb: 'Editar Unidad de Medida' },
                    loadComponent: () =>
                      import(
                        './GeneralMasters/Inventory/MeasurementUnits/Components/unit-of-measure-edit/unit-of-measure-edit.component'
                      ).then((m) => m.UnitOfMeasureEditComponent),
                  },
                ],
              },
            ],
          },
          {
            path: 'payment-methods',
            data: { breadcrumb: 'Métodos de Pago' },
            loadComponent: () =>
              import(
                './GeneralMasters/Components/MenuCards/menu.component'
              ).then((m) => m.MenuComponent),
          },
          {
            path: 'document-types',
            data: { breadcrumb: 'Tipos de Documentos' },
            children: [
              {
                path: '',
                pathMatch: 'full',
                redirectTo: 'list',
              },
              {
                path: 'list',
                data: { breadcrumb: null },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/document-types-list/document-types-list.component'
                  ).then((m) => m.DocumentTypesListComponent),
              },
              {
                path: 'create',
                data: { breadcrumb: 'Crear Tipo de Documento' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/document-types-creation/document-types-creation.component'
                  ).then((m) => m.DocumentTypesCreationComponent),
              },
              {
                path: 'edit/:id',
                data: { breadcrumb: 'Editar Tipo de Documento' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/document-types-edit/document-types-edit.component'
                  ).then((m) => m.DocumentTypesEditComponent),
              },
              {
                path: 'classes/list',
                data: { breadcrumb: 'Clases de Documentos' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/classes-of-documents-list/classes-of-documents-list.component'
                  ).then((m) => m.ClassesOfDocumentsListComponent),
              },
              {
                path: 'classes/create',
                data: { breadcrumb: 'Crear Clase de Documento' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/classes-of-documents-creation/classes-of-documents-creation.component'
                  ).then((m) => m.ClassesOfDocumentsCreationComponent),
              },
              {
                path: 'classes/edit/:id',
                data: { breadcrumb: 'Editar Clase de Documento' },
                loadComponent: () =>
                  import(
                    './GeneralMasters/DocumentTypes/Components/classes-of-documents-edit/classes-of-documents-edit.component'
                  ).then((m) => m.ClassesOfDocumentsEditComponent),
              },
            ],
          },

          {
            path: 'bank-accounts',
            data: { breadcrumb: 'Banco y Cuentas Bancarias' },
            loadComponent: () =>
              import(
                './GeneralMasters/Components/MenuCards/menu.component'
              ).then((m) => m.MenuComponent),
          },
          {
            path: 'cost-centers',
            data: { breadcrumb: 'Centros de Costo' },
            loadComponent: () =>
              import(
                './GeneralMasters/Components/MenuCards/menu.component'
              ).then((m) => m.MenuComponent),
          },

          {
            path: 'help-panels',
            data: { breadcrumb: 'Centro de Ayuda' },
            loadComponent: () =>
              import(
                './GeneralMasters/Components/MenuCards/menu.component'
              ).then((m) => m.MenuComponent),
          },
          {
            path: 'accounting-calendar',
            data: { breadcrumb: 'Calendario Contable' },
            loadComponent: () =>
              import(
                './GeneralMasters/AccountingCalendar/components/accounting-calendar/accounting-calendar.component'
              ).then((m) => m.AccountingCalendarComponent),
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
                path: 'auxiliary-books',
                data: {
                  breadcrumb: 'Libros Auxiliares',
                },
                children: [
                  {
                    path: 'list',
                    pathMatch: 'full',
                    data: {
                      breadcrumb: null,
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/auxiliary-books-list/auxiliary-books-list.component'
                      ).then((m) => m.AuxiliaryBooksListComponent),
                  },
                  {
                    path: 'inventory-and-balances',
                    data: {
                      breadcrumb: 'Libro de Inventario y Balances',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                  {
                    path: 'diary',
                    data: {
                      breadcrumb: 'Libro Diario',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                  {
                    path: 'major-and-balances',
                    data: {
                      breadcrumb: 'Libro Mayor y Balances',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                  {
                    path: 'account-book',
                    data: {
                      breadcrumb: 'Libro Auxiliary por Cuenta',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                  {
                    path: 'third-party-book',
                    data: {
                      breadcrumb: 'Libro Auxiliar por Tercero',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                  {
                    path: 'accounting-movement',
                    data: {
                      breadcrumb: 'Movimiento de Contabilidad',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/inventory-and-balances/inventory-and-balances.component'
                      ).then((m) => m.InventoryAndBalancesComponent),
                  },
                ],
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
