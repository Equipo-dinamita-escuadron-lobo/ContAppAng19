import { Routes } from '@angular/router';
import { StyleGuideComponent } from './Shared/Components/style-guide/style-guide.component';
import { LoginComponent } from './Core/auth/login/login.component';
import { ListEnterpriseComponent } from './GeneralMasters/Enterprise/list-enterprise/list-enterprise.component';
import { hasRoleChildGuard, hasRoleGuard } from './Core/Guards/has-role.guard';
import { MainTemplateComponent } from './Core/Components/MainTemplate/main-template.component';
import { ViewEnterpriseComponent } from './GeneralMasters/Enterprise/view-enterprise/view-enterprise.component';
import { Breadcrumb } from 'primeng/breadcrumb';
import { hasPermissionGuard } from './Core/Guards/has-permission.guard';
import {
  isAuthenticatedChildGuard,
  isAuthenticatedGuard,
} from './Core/Guards/is-authenticated.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./Core/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./Core/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./Core/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: '',
    component: MainTemplateComponent,
    canActivate: [isAuthenticatedGuard],
    children: [
      {
        path: 'enterprise',
        canActivateChild: [isAuthenticatedChildGuard],
        children: [
          {
            path: 'list',
            component: ListEnterpriseComponent,
            canActivate: [hasPermissionGuard],
            data: {
              breadcrumb: 'Empresas',
              permission: 'enterprise:read',
            },
          },
          {
            path: 'view/:id',
            component: ViewEnterpriseComponent,
            canActivate: [hasPermissionGuard],
            data: {
              breadcrumb: 'Ver Empresa',
              permission: 'enterprise:read',
            },
          },
        ],
      },
      {
        path: 'style-guide',
        component: StyleGuideComponent,
        canActivate: [hasRoleGuard],
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
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/diary/diary.component'
                      ).then((m) => m.DiaryComponent),
                  },
                  {
                    path: 'major-and-balances',
                    data: {
                      breadcrumb: 'Libro Mayor y Balances',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/major-and-balances/major-and-balances.component'
                      ).then((m) => m.MajorAndBalancesComponent),
                  },
                  {
                    path: 'account-book',
                    data: {
                      breadcrumb: 'Libro Auxiliary por Cuenta',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/account-book/account-book.component'
                      ).then((m) => m.AccountBookComponent),
                  },
                  {
                    path: 'third-party-book',
                    data: {
                      breadcrumb: 'Libro Auxiliar por Tercero',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/third-party-book/third-party-book.component'
                      ).then((m) => m.ThirdPartyBookComponent),
                  },
                  {
                    path: 'accounting-movement',
                    data: {
                      breadcrumb: 'Movimiento de Contabilidad',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Reports/auxiliary-books/Components/aux-book-types/accounting-movement/accounting-movement.component'
                      ).then((m) => m.AccountingMovementComponent),
                  },
                ],
              },
            ],
          },
          {
            path: 'wallet',
            data: {
              breadcrumb: 'Cartera',
            },
            children: [
              {
                path: 'receipts',
                data: {
                  breadcrumb: 'Recibos de Caja',
                },
                loadComponent: () =>
                  import(
                    './Financial/Wallet/CashReceipts/Components/receipts-list/receipts-list.component'
                  ).then((m) => m.ReceiptsListComponent),
              },
              {
                path: 'receipts/creation',
                data: {
                  breadcrumb: 'Creación de Recibos',
                },
                loadComponent: () =>
                  import(
                    './Financial/Wallet/CashReceipts/Components/receipt-creation/receipt-creation.component'
                  ).then((m) => m.ReceiptCreationComponent),
              },
              {
                path: 'receipts/details/:id',
                data: {
                  breadcrumb: 'Detalles del Recibo',
                },
                loadComponent: () =>
                  import(
                    './Financial/Wallet/CashReceipts/Components/receipt-details/receipt-details.component'
                  ).then((m) => m.ReceiptDetailsComponent),
              },
              {
                path: 'receipts/:id/accounting',
                data: {
                  breadcrumb: 'Contabilización del Recibo',
                },
                loadComponent: () =>
                  import(
                    './Financial/Wallet/CashReceipts/Components/receipt-accounting/receipt-accounting.component'
                  ).then((m) => m.ReceiptAccountingComponent),
              },
            {
              path: 'accounting-entries',
              data: {
                breadcrumb: 'Asientos Contables',
            },
              loadComponent: () =>
                import(
                  './Financial/Wallet/CashReceipts/Components/receipt-accounting-entries/receipt-accounting-entries.component'
                ).then((m) => m.ReceiptAccountingEntriesComponent),
            },
            ],
          },
          {
            path: 'treasury',
            data: {
              breadcrumb: 'Tesorería',
            },
            children: [
              {
                path: 'expense-receipts',
                data: {
                  breadcrumb: 'Comprobantes de Egreso',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/ExpenseReceipts/Components/expense-receipts-list/expense-receipts-list.component'
                  ).then((m) => m.ExpenseReceiptsListComponent),
              },
              {
                path: 'expense-receipts/creation',
                data: {
                  breadcrumb: 'Creación de Comprobantes',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/ExpenseReceipts/Components/expense-receipt-creation/expense-receipt-creation.component'
                  ).then((m) => m.ExpenseReceiptCreationComponent),
              },
              {
                path: 'expense-receipts/details/:id',
                data: {
                  breadcrumb: 'Detalles del Comprobante',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/ExpenseReceipts/Components/expense-receipt-details/expense-receipt-details.component'
                  ).then((m) => m.ExpenseReceiptDetailsComponent),
              },
              {
                path: 'expense-receipts/:id/accounting',
                data: {
                  breadcrumb: 'Contabilización del Comprobante',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/ExpenseReceipts/Components/expense-receipt-accounting/expense-receipt-accounting.component'
                  ).then((m) => m.ExpenseReceiptAccountingComponent),
              },
              // Purchase Bills Routes
              {
                path: 'purchase-bills',
                data: {
                  breadcrumb: 'Facturas de Compra',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/PurchaseBills/Components/bill-list/bill-list.component'
                  ).then((m) => m.BillListComponent),
              },
              {
                path: 'purchase-bills/create',
                data: {
                  breadcrumb: 'Nueva Factura de Compra',
                },
                loadComponent: () =>
                  import(
                    './Financial/Treasury/PurchaseBills/Components/bill-creation/bill-creation.component'
                  ).then((m) => m.BillCreationComponent),
              },
              {
                path: 'reports',
                data: {
                  breadcrumb: 'Reportes',
                },
                children: [
                  {
                    path: 'vendors',
                    data: {
                      breadcrumb: 'Reportes de Proveedores',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Treasury/Reports/VendorReports/Components/vendor-list/vendor-list.component'
                      ).then((m) => m.VendorListComponent),
                  },
                  {
                    path: 'vendor-report/:id',
                    data: {
                      breadcrumb: 'Reporte Individual',
                    },
                    loadComponent: () =>
                      import(
                        './Financial/Treasury/Reports/VendorReports/Components/vendor-report/vendor-report.component'
                      ).then((m) => m.VendorReportComponent),
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
              {
                path: 'peps',
                data: {
                  breadcrumb: 'KardexPEPS',
                },
                loadComponent: () =>
                  import(
                    './Commercial/BusinessMasters/ValuationModels/PEPS/list-kardex-peps/list-kardex-peps.component'
                  ).then((m) => m.ListKardexPepsComponent),
              }
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
            path: 'invoice-template',
            data: {
              breadcrumb: 'Plantilla de Factura',
            },
            loadComponent: () =>
              import(
                './Commercial/InvoiceTemplate/components/create-invoice/create-invoice.component'
              ).then((m) => m.CreateInvoiceComponent),
          },
          {
            path: 'return-template',
            data: {
              breadcrumb: 'Plantilla de Devolución',
            },
            loadComponent: () =>
              import(
                './Commercial/InvoiceTemplate/components/create-return/create-return.component'
              ).then((m) => m.CreateReturnComponent),
          },
        ],
      },
    ],
  },
];
