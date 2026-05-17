import { Routes } from '@angular/router';

export const TREASURY_ROUTES: Routes = [
  {
    path: 'expense-receipts',
    data: {
      breadcrumb: 'Comprobantes de Egreso',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/ExpenseReceipts/Components/expense-receipts-list/expense-receipts-list.component').then(
        (m) => m.ExpenseReceiptsListComponent
      ),
  },
  {
    path: 'expense-receipts/creation',
    data: {
      breadcrumb: 'Creación de Comprobantes',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/ExpenseReceipts/Components/expense-receipt-creation/expense-receipt-creation.component').then(
        (m) => m.ExpenseReceiptCreationComponent
      ),
  },
  {
    path: 'expense-receipts/details/:id',
    data: {
      breadcrumb: 'Detalles del Comprobante',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/ExpenseReceipts/Components/expense-receipt-details/expense-receipt-details.component').then(
        (m) => m.ExpenseReceiptDetailsComponent
      ),
  },
  {
    path: 'expense-receipts/:id/accounting',
    data: {
      breadcrumb: 'Contabilización del Comprobante',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/ExpenseReceipts/Components/expense-receipt-accounting/expense-receipt-accounting.component').then(
        (m) => m.ExpenseReceiptAccountingComponent
      ),
  },
  {
    path: 'purchase-bills',
    data: {
      breadcrumb: 'Programación Ordenes de Pago',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/PurchaseBills/Components/bill-list/bill-list.component').then(
        (m) => m.BillListComponent
      ),
  },
  {
    path: 'purchase-bills/create',
    data: {
      breadcrumb: 'Nueva Factura de Compra',
    },
    loadComponent: () =>
      import('../../Financial/Treasury/PurchaseBills/Components/bill-creation/bill-creation.component').then(
        (m) => m.BillCreationComponent
      ),
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
          import('../../Financial/Treasury/Reports/VendorReports/Components/vendor-list/vendor-list.component').then(
            (m) => m.VendorListComponent
          ),
      },
      {
        path: 'vendor-report/:id',
        data: {
          breadcrumb: 'Reporte Individual',
        },
        loadComponent: () =>
          import('../../Financial/Treasury/Reports/VendorReports/Components/vendor-report/vendor-report.component').then(
            (m) => m.VendorReportComponent
          ),
      },
      {
        path: 'aging-report',
        data: {
          breadcrumb: 'Vencimiento por edades',
        },
        loadComponent: () =>
          import('../../Financial/Treasury/Reports/AgingReport/Components/aging-report/aging-report.component').then(
            (m) => m.AgingReportComponent
          ),
      },
    ],
  },
];
