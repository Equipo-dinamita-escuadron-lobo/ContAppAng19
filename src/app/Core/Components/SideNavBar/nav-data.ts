import { INavbarData } from './helper';

export const navbarData: INavbarData[] = [
  {
    routeLink: '/home',
    icon: 'home',
    label: 'Home',
  },

  {
    routeLink: '/gen-masters',
    icon: 'construction',
    label: 'Maestros Generales',
    items: [
      {
        routeLink: '/gen-masters/account-catalogue',
        icon: 'account_balance_wallet',
        label: 'Catálogo de Cuentas',
      },
      {
        routeLink: '/gen-masters/taxes/list',
        icon: 'request_page',
        label: 'Impuestos',
      },
      {
        routeLink: '/gen-masters/third-parties/list',
        icon: 'groups',
        label: 'Terceros',
      },
      {
        routeLink: '/gen-masters/inventory',
        icon: 'data_table',
        label: 'Inventario',
        items: [
          {
            routeLink: '/gen-masters/inventory/products/list',
            icon: 'box',
            label: 'Productos',
          },
          {
            routeLink: '/gen-masters/inventory/product-types/list',
            icon: 'dashboard',
            label: 'Tipos de Productos',
          },
          {
            routeLink: '/gen-masters/inventory/categories/list',
            icon: 'category_search',
            label: 'Categorías',
          },
          {
            routeLink: '/gen-masters/inventory/measurement-units/list',
            icon: 'square_foot',
            label: 'Unidades de Medida',
          },
        ],
      },
      {
        routeLink: '/gen-masters/payment-methods',
        icon: 'payments',
        label: 'Métodos de Pago',
      },
      {
        routeLink: '/gen-masters/document-types',
        icon: 'description',
        label: 'Tipos de Documentos',
      },

      {
        routeLink: '/gen-masters/bank-accounts',
        icon: 'account_balance',
        label: 'Banco y Cuentas Bancarias',
      },
      {
        routeLink: '/gen-masters/cost-centers',
        icon: 'paid',
        label: 'Centros de Costo',
      },

      {
        routeLink: '/gen-masters/help-panels',
        icon: 'help',
        label: 'Centro de Ayuda',
      },
    ],
  },
  {
    routeLink: '/financial',
    icon: 'monetization_on',
    label: 'Financiero',
    items: [
      {
        routeLink: 'TO DO',
        icon: 'circle',
        label: 'Maestros',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'assignment',
            label: 'PUC',
          },
          {
            routeLink: 'TO DO',
            icon: 'docs',
            label: 'Documentos',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'format_list_numbered',
        label: 'Notas Contables',
      },
      {
        routeLink: '/financial/reports',
        icon: 'finance_mode',
        label: 'Reportes',
        items: [
          {
            routeLink: '/financial/reports/auxiliary-books/list',
            icon: 'book_5',
            label: 'Libros Auxiliares',
          },
          {
            routeLink: 'TO DO',
            icon: 'article',
            label: 'Estados Financieros',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'money_bag',
        label: 'Tesorería',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'receipt_long',
            label: 'Comprobantes de Egreso',
          },
          {
            routeLink: 'TO DO',
            icon: 'analytics',
            label: 'Reportes',
          },
        ],
      },
      {
        routeLink: 'TO DO',
        icon: 'point_of_sale',
        label: 'Cartera',
        items: [
          {
            routeLink: 'TO DO',
            icon: 'receipt',
            label: 'Recibos de Caja',
          },
          {
            routeLink: 'TO DO',
            icon: 'analytics',
            label: 'Reportes',
          },
        ],
      },
    ],
  },
     {
     routeLink: 'TO DO',
     icon: 'store',
     label: 'Comercial',
     items: [
       {
         routeLink: 'business-masters',
         icon: 'construction',
         label: 'Maestros Comerciales',
         items: [
           {
             routeLink: 'TO DO',
             icon: 'decimal_increase',
             label: 'Modelos de Valoracion',
             items: [
               {
                 routeLink: '/commercial/business-masters/kardex',
                 icon: '',
                 label: 'Inventario con Promedio Ponderado',
               },
               {
                 routeLink: 'TO DO',
                 icon: '',
                 label: 'Inventario PEPS',
               },
             ],
           },
           {
             routeLink: 'TO DO',
             icon: 'analytics',
             label: 'Reportes',
           },
         ],
       },
       {
         routeLink: 'commercial/sale-invoice',
         icon: 'order_approve',
         label: 'Factura de Venta',
       },
       {
         routeLink: 'TO DO',
         icon: 'receipt_long',
         label: 'Factura de Compra',
       },
       {
         routeLink: 'TO DO',
         icon: 'analytics',
         label: 'Reportes',
       },
       {
         routeLink: 'TO DO',
         icon: 'shelves',
         label: 'Ajustes de Inventario',
         items: [
           {
             routeLink: 'TO DO',
             icon: 'arrows_input',
             label: 'Entradas',
           },
           {
             routeLink: 'TO DO',
             icon: 'arrows_output',
             label: 'Salidas',
           },
           {
             routeLink: 'TO DO',
             icon: 'difference',
             label: 'Recalculos',
           },
         ],
       },
     ],
   },
];
