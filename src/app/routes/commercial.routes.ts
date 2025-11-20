import { Routes } from '@angular/router';

export const COMMERCIAL_ROUTES: Routes = [
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
          import('../Commercial/BusinessMasters/ValuationModels/WeightedAverage/list-kardex-weighted-average/list-kardex-weighted-average.component').then(
            (m) => m.ListKardexWeightedAverageComponent
          ),
      },
      {
        path: 'peps',
        data: {
          breadcrumb: 'KardexPEPS',
        },
        loadComponent: () =>
          import('../Commercial/BusinessMasters/ValuationModels/PEPS/list-kardex-peps/list-kardex-peps.component').then(
            (m) => m.ListKardexPepsComponent
          ),
      },
    ],
  },
  {
    path: 'sale-invoice',
    data: {
      breadcrumb: 'Factura de Venta',
    },
    loadComponent: () =>
      import('../Commercial/SaleInvoice/components/sale-invoice-creation/sale-invoice-creation.component').then(
        (m) => m.SaleInvoiceCreationComponent
      ),
  },
  {
    path: 'invoice-template',
    data: {
      breadcrumb: 'Plantilla de Factura',
    },
    loadComponent: () =>
      import('../Commercial/InvoiceTemplate/components/create-invoice/create-invoice.component').then(
        (m) => m.CreateInvoiceComponent
      ),
  },
  {
    path: 'return-template',
    data: {
      breadcrumb: 'Plantilla de Devolución',
    },
    loadComponent: () =>
      import('../Commercial/InvoiceTemplate/components/create-return/create-return.component').then(
        (m) => m.CreateReturnComponent
      ),
  },
  {
    path: 'non-commercial-template',
    data: {
      breadcrumb: 'Plantilla de Evento no Comercial',
    },
    loadComponent: () =>
      import('../Commercial/NonCommercialTemplate/components/create-non-commercial/create-non-commercial.component').then(
        (m) => m.CreateNonCommercialComponent
      ),
  },
];
